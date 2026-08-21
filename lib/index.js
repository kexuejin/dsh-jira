import z from "@deepseek-ai/schemastery";
import { defineTool } from "@deepseek-ai/dsh-tools";
import { readFile } from "node:fs/promises";
import { request } from "node:http";
import { Agent, request as request$1 } from "node:https";
import { credentialRef } from "@deepseek-ai/dsh-credentials";
//#region src/jira.ts
const DEFAULT_CREDENTIAL_REF = "JIRA_API_TOKEN";
const DEFAULT_TIMEOUT_MS = 15e3;
const DEFAULT_MAX_RESULTS = 25;
const DESCRIPTION_FIELDS = [
	"summary",
	"status",
	"statusCategory",
	"issuetype",
	"priority",
	"assignee",
	"reporter",
	"updated",
	"created"
];
const DETAIL_FIELDS = [
	...DESCRIPTION_FIELDS,
	"description",
	"comment"
];
function resolveConfig(config = {}) {
	const authMode = config.authMode ?? "pat";
	const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const maxResults = config.maxResults ?? DEFAULT_MAX_RESULTS;
	if (timeoutMs < 1e3) throw new Error("jira timeoutMs must be at least 1000");
	if (maxResults < 1 || maxResults > 100) throw new Error("jira maxResults must be between 1 and 100");
	const credential = credentialRef(config.tokenCredentialRef ?? DEFAULT_CREDENTIAL_REF);
	const baseUrl = normalizeBaseUrl(config.baseUrl);
	const username = cleanOptional(config.username);
	const caCertificatePath = cleanOptional(config.caCertificatePath);
	const proxyUrl = cleanOptional(config.proxyUrl);
	return {
		...baseUrl === void 0 ? {} : { baseUrl },
		authMode,
		tokenCredentialRef: credential,
		...username === void 0 ? {} : { username },
		strictTls: config.strictTls ?? true,
		...caCertificatePath === void 0 ? {} : { caCertificatePath },
		...proxyUrl === void 0 ? {} : { proxyUrl },
		timeoutMs,
		maxResults,
		assignedJql: cleanOptional(config.assignedJql) ?? "assignee = currentUser() ORDER BY updated DESC",
		watchingJql: cleanOptional(config.watchingJql) ?? "watcher = currentUser() ORDER BY updated DESC",
		reportedJql: cleanOptional(config.reportedJql) ?? "reporter = currentUser() ORDER BY updated DESC"
	};
}
function cleanOptional(value) {
	const trimmed = value?.trim();
	return trimmed === void 0 || trimmed.length === 0 ? void 0 : trimmed;
}
function normalizeBaseUrl(value) {
	const trimmed = cleanOptional(value);
	if (trimmed === void 0) return void 0;
	const parsed = new URL(trimmed);
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") throw new Error("jira baseUrl must use http or https");
	parsed.pathname = parsed.pathname.replace(/\/+$/u, "");
	parsed.search = "";
	parsed.hash = "";
	return parsed.toString().replace(/\/$/u, "");
}
function errorMessage(error) {
	return error instanceof Error ? error.message : String(error);
}
function isRecord$1(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function stringField$1(value) {
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : void 0;
}
function numberField$1(value) {
	return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function arrayField(value) {
	return Array.isArray(value) ? value : [];
}
function truncate(value, max = 2e4) {
	return value.length <= max ? value : `${value.slice(0, max)}… [truncated]`;
}
function redactedHttpError(method, target, statusCode, body) {
	const message = body.length > 0 ? `: ${truncate(body, 800)}` : "";
	return /* @__PURE__ */ new Error(`${method} ${target.origin}${target.pathname} failed with ${String(statusCode)}${message}`);
}
function appendQuery(target, query) {
	for (const [key, value] of Object.entries(query ?? {})) if (value !== void 0) target.searchParams.set(key, String(value));
}
function userLabel(value) {
	if (!isRecord$1(value)) return void 0;
	return stringField$1(value.displayName) ?? stringField$1(value.name) ?? stringField$1(value.key) ?? stringField$1(value.emailAddress);
}
function userObject(value) {
	if (!isRecord$1(value)) return void 0;
	const key = stringField$1(value.key);
	const name = stringField$1(value.name);
	const displayName = stringField$1(value.displayName);
	const emailAddress = stringField$1(value.emailAddress);
	return {
		...key === void 0 ? {} : { key },
		...name === void 0 ? {} : { name },
		...displayName === void 0 ? {} : { displayName },
		...emailAddress === void 0 ? {} : { emailAddress },
		...typeof value.active === "boolean" ? { active: value.active } : {}
	};
}
function textFromDoc(value) {
	if (value === void 0 || value === null) return void 0;
	if (typeof value === "string") return value;
	if (Array.isArray(value)) return value.map(textFromDoc).filter((part) => part !== void 0).join("\n");
	if (!isRecord$1(value)) return void 0;
	if (typeof value.text === "string") return value.text;
	const content = arrayField(value.content).map(textFromDoc).filter((part) => part !== void 0).join("\n");
	return content.length === 0 ? void 0 : content;
}
function issueFields(raw) {
	return isRecord$1(raw.fields) ? raw.fields : {};
}
function issueUrl(baseUrl, key) {
	return `${baseUrl}/browse/${encodeURIComponent(key)}`;
}
function normalizeIssueSummary(baseUrl, raw) {
	if (!isRecord$1(raw)) throw new Error("jira issue must be an object");
	const key = stringField$1(raw.key);
	if (key === void 0) throw new Error("jira issue is missing key");
	const id = stringField$1(raw.id);
	const fields = issueFields(raw);
	const status = isRecord$1(fields.status) ? stringField$1(fields.status.name) : void 0;
	const statusCategory = isRecord$1(fields.status) && isRecord$1(fields.status.statusCategory) ? stringField$1(fields.status.statusCategory.name) : void 0;
	const issueType = isRecord$1(fields.issuetype) ? stringField$1(fields.issuetype.name) : void 0;
	const priority = isRecord$1(fields.priority) ? stringField$1(fields.priority.name) : void 0;
	const assignee = userLabel(fields.assignee);
	const reporter = userLabel(fields.reporter);
	const updated = stringField$1(fields.updated);
	const created = stringField$1(fields.created);
	return {
		key,
		...id === void 0 ? {} : { id },
		summary: stringField$1(fields.summary) ?? "(no summary)",
		status: status ?? "Unknown",
		...statusCategory === void 0 ? {} : { statusCategory },
		...issueType === void 0 ? {} : { issueType },
		...priority === void 0 ? {} : { priority },
		...assignee === void 0 ? {} : { assignee },
		...reporter === void 0 ? {} : { reporter },
		...updated === void 0 ? {} : { updated },
		...created === void 0 ? {} : { created },
		url: issueUrl(baseUrl, key)
	};
}
function normalizeComment(raw) {
	if (!isRecord$1(raw)) return void 0;
	const id = stringField$1(raw.id);
	if (id === void 0) return void 0;
	const body = textFromDoc(raw.body) ?? "";
	const author = userLabel(raw.author);
	const created = stringField$1(raw.created);
	const updated = stringField$1(raw.updated);
	return {
		id,
		...author === void 0 ? {} : { author },
		...created === void 0 ? {} : { created },
		...updated === void 0 ? {} : { updated },
		body: truncate(body, 5e3)
	};
}
function normalizeTransition(raw) {
	if (!isRecord$1(raw)) return void 0;
	const id = stringField$1(raw.id);
	const name = stringField$1(raw.name);
	if (id === void 0 || name === void 0) return void 0;
	const to = isRecord$1(raw.to) ? stringField$1(raw.to.name) : void 0;
	return {
		id,
		name,
		...to === void 0 ? {} : { to }
	};
}
function normalizeIssueDetail(baseUrl, raw, transitions) {
	const summary = normalizeIssueSummary(baseUrl, raw);
	const fields = isRecord$1(raw) ? issueFields(raw) : {};
	const comments = arrayField((isRecord$1(fields.comment) ? fields.comment : {}).comments).map(normalizeComment).filter((item) => item !== void 0);
	return {
		...summary,
		...textFromDoc(fields.description) === void 0 ? {} : { description: truncate(textFromDoc(fields.description) ?? "", 1e4) },
		comments,
		transitions
	};
}
function buildCommentBody(body) {
	return body;
}
function buildAuthHeader(config, token) {
	if (config.authMode === "pat") return `Bearer ${token}`;
	if (config.username === void 0) throw new Error("jira username is required for basic auth");
	return `Basic ${Buffer.from(`${config.username}:${token}`).toString("base64")}`;
}
async function caOption(config) {
	if (config.caCertificatePath === void 0) return void 0;
	return await readFile(config.caCertificatePath, "utf8");
}
function agentFor(target, config, ca) {
	if (target.protocol === "http:") return void 0;
	return new Agent({
		rejectUnauthorized: config.strictTls,
		...ca === void 0 ? {} : { ca }
	});
}
function requestJson(target, options, body, timeoutMs) {
	const client = target.protocol === "https:" ? request$1 : request;
	return new Promise((resolve, reject) => {
		const request = client(target, options, (response) => {
			response.setEncoding("utf8");
			let responseBody = "";
			response.on("data", (chunk) => {
				responseBody += chunk;
			});
			response.on("end", () => {
				resolve({
					statusCode: response.statusCode ?? 0,
					headers: response.headers,
					body: responseBody
				});
			});
		});
		request.setTimeout(timeoutMs, () => {
			request.destroy(/* @__PURE__ */ new Error(`jira request timed out after ${String(timeoutMs)}ms`));
		});
		request.on("error", reject);
		if (body !== void 0) request.write(body);
		request.end();
	});
}
var JiraClient = class {
	ctx;
	config;
	constructor(ctx, config) {
		this.ctx = ctx;
		this.config = config;
	}
	configView() {
		return {
			...this.config.baseUrl === void 0 ? {} : { baseUrl: this.config.baseUrl },
			authMode: this.config.authMode,
			credentialRef: this.config.tokenCredentialRef,
			...this.config.username === void 0 ? {} : { username: this.config.username },
			strictTls: this.config.strictTls,
			...this.config.caCertificatePath === void 0 ? {} : { caCertificatePath: this.config.caCertificatePath },
			...this.config.proxyUrl === void 0 ? {} : { proxyUrl: this.config.proxyUrl },
			timeoutMs: this.config.timeoutMs,
			maxResults: this.config.maxResults
		};
	}
	async status() {
		const credentialConfigured = await this.hasCredential();
		if (this.config.baseUrl === void 0) return {
			status: "missing-config",
			config: this.configView(),
			credentialConfigured,
			message: "Set jira baseUrl in the dsh-jira plugin config."
		};
		if (!credentialConfigured) return {
			status: "missing-credential",
			config: this.configView(),
			credentialConfigured,
			message: `Set credential ${this.config.tokenCredentialRef}.`
		};
		try {
			const user = userObject(await this.request({ path: "/rest/api/2/myself" }));
			return {
				status: "configured",
				config: this.configView(),
				credentialConfigured,
				message: "Jira connection is configured.",
				...user === void 0 ? {} : { user }
			};
		} catch (error) {
			return {
				status: "error",
				config: this.configView(),
				credentialConfigured,
				message: errorMessage(error)
			};
		}
	}
	async search(args) {
		const jql = this.jqlFor(args);
		const maxResults = Math.min(Math.max(args.maxResults ?? this.config.maxResults, 1), this.config.maxResults);
		const startAt = Math.max(args.startAt ?? 0, 0);
		const response = await this.request({
			path: "/rest/api/2/search",
			query: {
				jql,
				startAt,
				maxResults,
				fields: DESCRIPTION_FIELDS.join(",")
			}
		});
		const baseUrl = this.requireBaseUrl();
		const total = numberField$1(response.total);
		return {
			jql,
			startAt: response.startAt ?? startAt,
			maxResults: response.maxResults ?? maxResults,
			...total === void 0 ? {} : { total },
			issues: arrayField(response.issues).map((issue) => normalizeIssueSummary(baseUrl, issue))
		};
	}
	async getIssue(args) {
		const issueKey = issueKeyArg(args.issueKey);
		const [issue, transitions] = await Promise.all([this.request({
			path: `/rest/api/2/issue/${encodeURIComponent(issueKey)}`,
			query: { fields: DETAIL_FIELDS.join(",") }
		}), this.transitions(issueKey)]);
		return normalizeIssueDetail(this.requireBaseUrl(), issue, transitions);
	}
	async addComment(args) {
		const issueKey = issueKeyArg(args.issueKey);
		const body = cleanRequired(args.body, "comment body");
		await this.request({
			method: "POST",
			path: `/rest/api/2/issue/${encodeURIComponent(issueKey)}/comment`,
			body: { body: buildCommentBody(body) }
		});
		return {
			issueKey,
			status: "commented",
			message: `Added comment to ${issueKey}.`
		};
	}
	async transitionIssue(args) {
		const issueKey = issueKeyArg(args.issueKey);
		const transitions = await this.transitions(issueKey);
		const transition = this.matchTransition(transitions, args.transitionId, args.transitionName);
		await this.request({
			method: "POST",
			path: `/rest/api/2/issue/${encodeURIComponent(issueKey)}/transitions`,
			body: {
				transition: { id: transition.id },
				...args.comment === void 0 || args.comment.trim().length === 0 ? {} : { update: { comment: [{ add: { body: buildCommentBody(args.comment.trim()) } }] } }
			}
		});
		return {
			issueKey,
			status: transition.to ?? transition.name,
			message: `Transitioned ${issueKey} via ${transition.name}.`
		};
	}
	jqlFor(args) {
		if (args.view === "assigned" || args.view === void 0) return cleanOptional(args.jql) ?? this.config.assignedJql;
		if (args.view === "watching") return cleanOptional(args.jql) ?? this.config.watchingJql;
		if (args.view === "reported") return cleanOptional(args.jql) ?? this.config.reportedJql;
		return cleanRequired(args.jql, "jql");
	}
	async transitions(issueKey) {
		const result = await this.request({ path: `/rest/api/2/issue/${encodeURIComponent(issueKey)}/transitions` });
		return (isRecord$1(result) ? arrayField(result.transitions) : []).map(normalizeTransition).filter((item) => item !== void 0);
	}
	matchTransition(transitions, id, name) {
		const cleanId = cleanOptional(id);
		if (cleanId !== void 0) {
			const matched = transitions.find((transition) => transition.id === cleanId);
			if (matched !== void 0) return matched;
		}
		const cleanName = cleanOptional(name)?.toLowerCase();
		if (cleanName !== void 0) {
			const matched = transitions.find((transition) => transition.name.toLowerCase() === cleanName);
			if (matched !== void 0) return matched;
		}
		const available = transitions.map((transition) => `${transition.id}:${transition.name}`).join(", ");
		throw new Error(`jira transition not found; available transitions: ${available || "none"}`);
	}
	async hasCredential() {
		return await this.resolveToken() !== void 0;
	}
	async resolveToken() {
		const credentials = this.ctx.get("credentials");
		if (credentials !== void 0) return (await credentials.resolve(this.config.tokenCredentialRef))?.value;
		const value = process.env[this.config.tokenCredentialRef];
		return value === void 0 || value.length === 0 ? void 0 : value;
	}
	requireBaseUrl() {
		if (this.config.baseUrl === void 0) throw new Error("jira baseUrl is not configured");
		return this.config.baseUrl;
	}
	async request(options) {
		const baseUrl = this.requireBaseUrl();
		if (this.config.proxyUrl !== void 0) throw new Error("jira proxyUrl is configured but proxy transport is not implemented yet");
		const token = await this.resolveToken();
		if (token === void 0) throw new Error(`jira credential ${this.config.tokenCredentialRef} is not configured`);
		const target = new URL(options.path, `${baseUrl}/`);
		appendQuery(target, options.query);
		const method = options.method ?? "GET";
		const body = options.body === void 0 ? void 0 : JSON.stringify(options.body);
		const ca = await caOption(this.config);
		const agent = agentFor(target, this.config, ca);
		const response = await requestJson(target, {
			method,
			headers: {
				authorization: buildAuthHeader(this.config, token),
				accept: "application/json",
				"user-agent": "dsh-jira/0.1.0",
				...body === void 0 ? {} : {
					"content-type": "application/json",
					"content-length": String(Buffer.byteLength(body))
				}
			},
			agent
		}, body, this.config.timeoutMs);
		if (response.statusCode >= 300 && response.statusCode < 400 || response.headers.location !== void 0) throw new Error(`${method} ${target.origin}${target.pathname} redirected; credential-bearing Jira requests never follow redirects`);
		if (response.statusCode < 200 || response.statusCode >= 300) throw redactedHttpError(method, target, response.statusCode, response.body);
		if (response.body.trim().length === 0) return {};
		try {
			return JSON.parse(response.body);
		} catch {
			throw new Error(`${method} ${target.origin}${target.pathname} returned non-JSON response`);
		}
	}
};
function cleanRequired(value, label) {
	const trimmed = cleanOptional(value);
	if (trimmed === void 0) throw new Error(`jira ${label} is required`);
	return trimmed;
}
function issueKeyArg(value) {
	const trimmed = cleanRequired(value, "issue key");
	if (!/^[A-Z][A-Z0-9]+-\d+$/u.test(trimmed)) throw new Error(`invalid jira issue key: ${trimmed}`);
	return trimmed;
}
function createJiraClient(ctx, config) {
	return new JiraClient(ctx, resolveConfig(config));
}
const internals = {
	buildAuthHeader,
	normalizeIssueSummary,
	resolveConfig
};
//#endregion
//#region src/model.ts
const JIRA_RPC_CHANNEL = "/jira";
//#endregion
//#region src/rpc.ts
function asJson$1(value) {
	return JSON.parse(JSON.stringify(value));
}
function isRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}
function stringField(payload, field) {
	if (!isRecord(payload)) return void 0;
	const value = payload[field];
	return typeof value === "string" && value.trim().length > 0 ? value.trim() : void 0;
}
function numberField(payload, field) {
	if (!isRecord(payload)) return void 0;
	const value = payload[field];
	return typeof value === "number" && Number.isFinite(value) ? value : void 0;
}
function viewField(payload) {
	const value = stringField(payload, "view");
	return value === "assigned" || value === "watching" || value === "reported" || value === "custom" ? value : void 0;
}
function searchArgs(payload) {
	const jql = stringField(payload, "jql");
	const view = viewField(payload);
	const startAt = numberField(payload, "startAt");
	const maxResults = numberField(payload, "maxResults");
	return {
		...jql === void 0 ? {} : { jql },
		...view === void 0 ? {} : { view },
		...startAt === void 0 ? {} : { startAt },
		...maxResults === void 0 ? {} : { maxResults }
	};
}
function getIssueArgs(payload) {
	return { issueKey: stringField(payload, "issueKey") ?? "" };
}
function addCommentArgs(payload) {
	return {
		issueKey: stringField(payload, "issueKey") ?? "",
		body: stringField(payload, "body") ?? ""
	};
}
function transitionIssueArgs(payload) {
	const transitionId = stringField(payload, "transitionId");
	const transitionName = stringField(payload, "transitionName");
	const comment = stringField(payload, "comment");
	return {
		issueKey: stringField(payload, "issueKey") ?? "",
		...transitionId === void 0 ? {} : { transitionId },
		...transitionName === void 0 ? {} : { transitionName },
		...comment === void 0 ? {} : { comment }
	};
}
function ok(value) {
	return {
		ok: true,
		value: asJson$1(value)
	};
}
function failure(error) {
	return {
		ok: false,
		error: {
			code: "command-error",
			message: error instanceof Error ? error.message : String(error),
			details: {}
		}
	};
}
function registerJiraRpc(ctx, config) {
	ctx.connection.rpc.handle(JIRA_RPC_CHANNEL, async (endpoint, payload) => {
		const client = createJiraClient(ctx, config);
		try {
			switch (endpoint) {
				case "status": return ok(await client.status());
				case "search": return ok(await client.search(searchArgs(payload)));
				case "getIssue": return ok(await client.getIssue(getIssueArgs(payload)));
				case "addComment": return ok(await client.addComment(addCommentArgs(payload)));
				case "transitionIssue": return ok(await client.transitionIssue(transitionIssueArgs(payload)));
				default: return failure(/* @__PURE__ */ new Error(`unknown jira endpoint: ${endpoint}`));
			}
		} catch (error) {
			return failure(error);
		}
	}, { authority: "loopback" });
}
//#endregion
//#region src/index.ts
const name = "jira-issue-tracker";
const inject = ["tools", "connection"];
const Config = z.object({
	baseUrl: z.string(),
	authMode: z.union(["pat", "basic"]).default("pat"),
	tokenCredentialRef: z.string().role("credential-ref").default("JIRA_API_TOKEN"),
	username: z.string(),
	strictTls: z.boolean().default(true),
	caCertificatePath: z.string(),
	proxyUrl: z.string(),
	timeoutMs: z.number().step(1).min(1e3).default(15e3),
	maxResults: z.number().step(1).min(1).max(100).default(25),
	assignedJql: z.string(),
	watchingJql: z.string(),
	reportedJql: z.string()
});
const JSON_OUTPUT = { schema: { type: "json" } };
const SEARCH_ARGS = {
	jql: {
		type: "string",
		description: "Optional explicit JQL. Required when view is custom."
	},
	view: {
		type: "string",
		description: "One of assigned, watching, reported, or custom. Defaults to assigned."
	},
	startAt: {
		type: "number",
		description: "Zero-based page start."
	},
	maxResults: {
		type: "number",
		description: "Maximum issues to return, capped by plugin config."
	}
};
const ISSUE_KEY_ARG = { issueKey: {
	type: "string",
	description: "Jira issue key, for example PROJ-123."
} };
function asJson(value) {
	return JSON.parse(JSON.stringify(value));
}
function textResult(text) {
	return [{
		type: "text",
		text
	}];
}
function jsonObject(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value) ? value : void 0;
}
function jsonString(value, fallback) {
	return typeof value === "string" || typeof value === "number" || typeof value === "boolean" ? String(value) : fallback;
}
function apply(ctx, config = {}) {
	registerJiraRpc(ctx, config);
	ctx.tools.register(defineTool({
		name: "jira_search_issues",
		description: ["Search the configured internal Jira instance with JQL or a personal view.", "Read-only; returns capped issue summaries and never exposes credentials."].join(" "),
		parameters: SEARCH_ARGS,
		output: {
			...JSON_OUTPUT,
			render: (_args, value) => {
				const issues = jsonObject(value)?.issues;
				const count = Array.isArray(issues) ? issues.length : 0;
				return textResult(`Jira search returned ${String(count)} issue(s).`);
			}
		},
		async execute(args) {
			return asJson(await createJiraClient(ctx, config).search(args));
		},
		presentCall: (args) => ({
			card: "generic",
			title: "Search Jira issues",
			kind: "other",
			rawInput: args
		})
	}));
	ctx.tools.register(defineTool({
		name: "jira_get_issue",
		description: "Read one Jira issue with selected fields, recent comments, and available transitions. Read-only.",
		parameters: ISSUE_KEY_ARG,
		output: {
			...JSON_OUTPUT,
			render: (_args, value) => {
				const object = jsonObject(value);
				return textResult(`Jira issue ${jsonString(object?.key, "unknown")} — ${jsonString(object?.summary, "no summary")}`);
			}
		},
		async execute(args) {
			return asJson(await createJiraClient(ctx, config).getIssue(args));
		},
		presentCall: (args) => ({
			card: "generic",
			title: "Get Jira issue",
			kind: "other",
			rawInput: args
		})
	}));
	ctx.tools.register(defineTool({
		name: "jira_add_comment",
		description: "Add a comment to one Jira issue. Requires an explicit issue key and comment body; never performs bulk writes.",
		parameters: {
			...ISSUE_KEY_ARG,
			body: {
				type: "string",
				description: "Plain-text Jira comment body."
			}
		},
		output: {
			...JSON_OUTPUT,
			render: (_args, value) => {
				return textResult(jsonString(jsonObject(value)?.message, "Jira comment request completed."));
			}
		},
		async execute(args) {
			return asJson(await createJiraClient(ctx, config).addComment(args));
		},
		presentCall: (args) => ({
			card: "generic",
			title: "Comment on Jira issue",
			kind: "other",
			rawInput: args
		})
	}));
	ctx.tools.register(defineTool({
		name: "jira_transition_issue",
		description: ["Transition one Jira issue using an explicit transition id or exact transition name.", "Call jira_get_issue first to inspect available transitions."].join(" "),
		parameters: {
			...ISSUE_KEY_ARG,
			transitionId: {
				type: "string",
				description: "Transition id from jira_get_issue."
			},
			transitionName: {
				type: "string",
				description: "Exact transition name from jira_get_issue."
			},
			comment: {
				type: "string",
				description: "Optional transition comment."
			}
		},
		output: {
			...JSON_OUTPUT,
			render: (_args, value) => {
				return textResult(jsonString(jsonObject(value)?.message, "Jira transition request completed."));
			}
		},
		async execute(args) {
			return asJson(await createJiraClient(ctx, config).transitionIssue(args));
		},
		presentCall: (args) => ({
			card: "generic",
			title: "Transition Jira issue",
			kind: "other",
			rawInput: args
		})
	}));
}
//#endregion
export { Config, JIRA_RPC_CHANNEL, apply, createJiraClient, inject, internals, name, registerJiraRpc, resolveConfig };

//# sourceMappingURL=index.js.map