window.__ModuleLoader__.load({
	id: "dsh-jira",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_dom_client = require("react-dom/client");
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/model.ts
		const JIRA_RPC_CHANNEL = "/jira";
		//#endregion
		//#region node_modules/.pnpm/clsx@2.1.1/node_modules/clsx/dist/clsx.mjs
		function r(e) {
			var t, f, n = "";
			if ("string" == typeof e || "number" == typeof e) n += e;
			else if ("object" == typeof e) if (Array.isArray(e)) {
				var o = e.length;
				for (t = 0; t < o; t++) e[t] && (f = r(e[t])) && (n && (n += " "), n += f);
			} else for (f in e) e[f] && (n && (n += " "), n += f);
			return n;
		}
		function clsx() {
			for (var e, t, f = 0, n = "", o = arguments.length; f < o; f++) (e = arguments[f]) && (t = r(e)) && (n && (n += " "), n += t);
			return n;
		}
		//#endregion
		//#region \0dsh-jira-css:/Volumes/Kapp/source/dsh-jira/src/client/JiraPanel.module.css.mjs
		const css = ".XUv5wW_view{z-index:90;pointer-events:none;position:fixed;inset:0}.XUv5wW_entry{width:100%;height:32px;color:var(--dsw-alias-label-secondary,inherit);cursor:pointer;font:inherit;white-space:nowrap;background:0 0;border:none;border-radius:8px;align-items:center;gap:8px;padding:0 12px;font-size:13px;display:flex}.XUv5wW_entry:hover{background:var(--dsw-specific-sidebar-nav-item-hover,#7f7f7f1a);color:var(--dsw-alias-label-primary,inherit)}.XUv5wW_entry[data-active]{background:var(--dsw-specific-sidebar-nav-item-active,#7f7f7f24);color:var(--dsw-alias-label-primary,inherit);font-weight:600}.XUv5wW_entryIcon{flex:none;justify-content:center;align-items:center;display:inline-flex}.XUv5wW_entryLabel{text-overflow:ellipsis;overflow:hidden}[data-dsh-frame][data-sidebar-collapsed] .XUv5wW_entry{justify-content:center;width:100%;padding:0}[data-dsh-frame][data-sidebar-collapsed] .XUv5wW_entryLabel{display:none}.XUv5wW_popover{border:1px solid var(--dsh-color-border-subtle,#7f7f7f3d);background:var(--dsh-color-bg-elevated,Canvas);pointer-events:auto;z-index:91;border-radius:16px;width:min(980px,100vw - 96px);max-height:min(760px,100vh - 104px);padding:16px;position:fixed;top:76px;left:72px;overflow:auto;box-shadow:0 18px 48px #0003}.XUv5wW_header,.XUv5wW_detailTop{justify-content:space-between;align-items:flex-start;gap:16px;display:flex}.XUv5wW_title,.XUv5wW_detailTitle,.XUv5wW_sectionTitle{margin:0;font-weight:650}.XUv5wW_subtitle,.XUv5wW_detailMeta,.XUv5wW_empty,.XUv5wW_issueCard small,.XUv5wW_total,.XUv5wW_configGrid span,.XUv5wW_comment strong{color:var(--dsh-color-text-secondary,GrayText);font-size:12px;line-height:1.4}.XUv5wW_subtitle{margin:4px 0 0}.XUv5wW_iconButton{color:inherit;cursor:pointer;background:0 0;border:0;border-radius:8px;padding:4px 8px;font-size:20px;line-height:1}.XUv5wW_iconButton:hover{background:var(--dsh-color-bg-hover,#7f7f7f1a)}.XUv5wW_statusBox,.XUv5wW_configBox{border:1px solid var(--dsh-color-border-subtle,#7f7f7f2e);border-radius:14px;grid-template-columns:minmax(180px,1fr) auto;gap:10px;margin-top:14px;padding:12px;display:grid}.XUv5wW_configBox{grid-template-columns:1fr}.XUv5wW_configHeader{justify-content:space-between;align-items:flex-start;gap:12px;display:flex}.XUv5wW_formGrid{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:12px;display:grid}.XUv5wW_formGrid label{flex-direction:column;gap:5px;min-width:0;display:flex}.XUv5wW_formGrid label span{color:var(--dsh-color-text-secondary,GrayText);font-size:12px}.XUv5wW_formGrid input,.XUv5wW_formGrid select,.XUv5wW_mappingTextArea{border:1px solid var(--dsh-color-border-subtle,#7f7f7f3d);background:var(--dsh-color-bg-elevated,Canvas);color:inherit;font:inherit;border-radius:10px;min-width:0;padding:8px 10px;font-size:12px}.XUv5wW_mappingTextArea{resize:vertical;min-height:92px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,Liberation Mono,monospace}.XUv5wW_checkboxLabel{align-items:center;padding-top:20px;flex-direction:row!important}.XUv5wW_checkboxLabel input{flex:none;width:auto}.XUv5wW_wideField{grid-column:span 2}.XUv5wW_configGrid{word-break:break-word;grid-column:1/-1;grid-template-columns:max-content minmax(0,1fr);gap:5px 10px;display:grid}.XUv5wW_toolbar,.XUv5wW_transitions{flex-wrap:wrap;align-items:center;gap:8px;margin-top:14px;display:flex}.XUv5wW_primaryButton,.XUv5wW_tabButton,.XUv5wW_transitions button,.XUv5wW_openLink{border:1px solid var(--dsh-color-border-subtle,#7f7f7f3d);background:var(--dsh-color-bg-soft,#7f7f7f14);color:inherit;cursor:pointer;font:inherit;border-radius:10px;padding:7px 10px;font-size:12px;text-decoration:none}.XUv5wW_primaryButton:hover,.XUv5wW_tabButton:hover,.XUv5wW_transitions button:hover:not(:disabled),.XUv5wW_openLink:hover{background:var(--dsh-color-bg-hover,#7f7f7f24)}.XUv5wW_primaryButton:disabled,.XUv5wW_transitions button:disabled{cursor:not-allowed;opacity:.55}.XUv5wW_tabButtonActive{border-color:var(--dsh-color-accent,#3b82f6);color:var(--dsh-color-accent,#2563eb);font-weight:650}.XUv5wW_jqlInput{border:1px solid var(--dsh-color-border-subtle,#7f7f7f3d);background:var(--dsh-color-bg-elevated,Canvas);color:inherit;font:inherit;border-radius:10px;flex:1;min-width:260px;padding:8px 10px;font-size:12px}.XUv5wW_error,.XUv5wW_notice{border-radius:10px;margin:12px 0 0;padding:8px 10px;font-size:12px;line-height:1.4}.XUv5wW_error{color:#c00000;background:#c000001a}.XUv5wW_notice{color:#167c3a;background:#0080001a}.XUv5wW_content{grid-template-columns:minmax(260px,340px) minmax(0,1fr);gap:14px;margin-top:14px;display:grid}.XUv5wW_issueList,.XUv5wW_detail{border:1px solid var(--dsh-color-border-subtle,#7f7f7f2e);border-radius:14px;min-height:420px;padding:10px}.XUv5wW_issueList{flex-direction:column;gap:8px;display:flex}.XUv5wW_issueCard{border:1px solid var(--dsh-color-border-subtle,#7f7f7f2e);color:inherit;cursor:pointer;text-align:left;background:0 0;border-radius:12px;flex-direction:column;gap:4px;padding:10px;display:flex}.XUv5wW_issueCard:hover,.XUv5wW_issueCardActive{background:var(--dsh-color-bg-hover,#7f7f7f1a)}.XUv5wW_issueCardActive{border-color:var(--dsh-color-accent,#3b82f6)}.XUv5wW_issueKey{color:var(--dsh-color-accent,#2563eb);font-size:12px;font-weight:700}.XUv5wW_section{border-top:1px solid var(--dsh-color-border-subtle,#7f7f7f24);margin-top:14px;padding-top:12px}.XUv5wW_description,.XUv5wW_comment p{white-space:pre-wrap;margin:8px 0 0;font-size:13px;line-height:1.5}.XUv5wW_commentBox{border:1px solid var(--dsh-color-border-subtle,#7f7f7f3d);background:var(--dsh-color-bg-elevated,Canvas);box-sizing:border-box;color:inherit;font:inherit;resize:vertical;border-radius:10px;width:100%;min-height:76px;margin:8px 0;padding:8px 10px;font-size:13px;display:block}.XUv5wW_comment{border:1px solid var(--dsh-color-border-subtle,#7f7f7f29);border-radius:10px;margin-top:8px;padding:9px 10px}@media (width<=820px){.XUv5wW_popover{width:auto;top:64px;left:12px;right:12px}.XUv5wW_content,.XUv5wW_formGrid{grid-template-columns:1fr}.XUv5wW_wideField{grid-column:auto}}";
		const tagId = "dsh-jira/JiraPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-jira";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var JiraPanel_module_css_default = {
			"popover": "XUv5wW_popover",
			"configBox": "XUv5wW_configBox",
			"description": "XUv5wW_description",
			"jqlInput": "XUv5wW_jqlInput",
			"detailTop": "XUv5wW_detailTop",
			"statusBox": "XUv5wW_statusBox",
			"header": "XUv5wW_header",
			"configGrid": "XUv5wW_configGrid",
			"entryLabel": "XUv5wW_entryLabel",
			"transitions": "XUv5wW_transitions",
			"tabButton": "XUv5wW_tabButton",
			"configHeader": "XUv5wW_configHeader",
			"openLink": "XUv5wW_openLink",
			"comment": "XUv5wW_comment",
			"detail": "XUv5wW_detail",
			"primaryButton": "XUv5wW_primaryButton",
			"tabButtonActive": "XUv5wW_tabButtonActive",
			"wideField": "XUv5wW_wideField",
			"total": "XUv5wW_total",
			"formGrid": "XUv5wW_formGrid",
			"title": "XUv5wW_title",
			"content": "XUv5wW_content",
			"detailMeta": "XUv5wW_detailMeta",
			"commentBox": "XUv5wW_commentBox",
			"entry": "XUv5wW_entry",
			"issueList": "XUv5wW_issueList",
			"mappingTextArea": "XUv5wW_mappingTextArea",
			"subtitle": "XUv5wW_subtitle",
			"detailTitle": "XUv5wW_detailTitle",
			"iconButton": "XUv5wW_iconButton",
			"notice": "XUv5wW_notice",
			"toolbar": "XUv5wW_toolbar",
			"issueKey": "XUv5wW_issueKey",
			"issueCardActive": "XUv5wW_issueCardActive",
			"error": "XUv5wW_error",
			"empty": "XUv5wW_empty",
			"section": "XUv5wW_section",
			"checkboxLabel": "XUv5wW_checkboxLabel",
			"sectionTitle": "XUv5wW_sectionTitle",
			"entryIcon": "XUv5wW_entryIcon",
			"view": "XUv5wW_view",
			"issueCard": "XUv5wW_issueCard"
		};
		//#endregion
		//#region src/client/JiraPanel.tsx
		function viewLabel(view, t) {
			switch (view) {
				case "assigned": return t("panel.assigned");
				case "watching": return t("panel.watching");
				case "reported": return t("panel.reported");
				case "custom": return t("panel.custom");
			}
		}
		function statusLabel(status, t) {
			switch (status) {
				case "configured": return t("panel.configured");
				case "missing-config": return t("panel.configMissing");
				case "missing-credential": return t("panel.credentialMissing");
				case "error": return t("panel.error");
			}
		}
		function selectedIssue(issues, selectedKey) {
			if (selectedKey !== void 0) return issues.find((issue) => issue.key === selectedKey) ?? issues[0];
			return issues[0];
		}
		function dateLabel(value) {
			if (value === void 0) return "—";
			try {
				return new Date(value).toLocaleString();
			} catch {
				return value;
			}
		}
		function draftFromConfig(config) {
			return {
				baseUrl: config.baseUrl ?? "",
				authMode: config.authMode ?? "pat",
				tokenCredentialRef: config.tokenCredentialRef ?? "JIRA_API_TOKEN",
				username: config.username ?? "",
				strictTls: config.strictTls ?? true,
				timeoutMs: config.timeoutMs ?? 15e3,
				maxResults: config.maxResults ?? 25,
				assignedJql: config.assignedJql ?? "assignee = currentUser() ORDER BY updated DESC",
				watchingJql: config.watchingJql ?? "watcher = currentUser() ORDER BY updated DESC",
				reportedJql: config.reportedJql ?? "reporter = currentUser() ORDER BY updated DESC",
				workBoardSync: config.workBoardSync ?? true,
				workBoardSyncJql: config.workBoardSyncJql ?? "assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC",
				workBoardSyncIntervalMs: config.workBoardSyncIntervalMs ?? 3e5,
				workBoardWriteback: config.workBoardWriteback ?? true,
				workBoardDoneTransition: config.workBoardDoneTransition ?? "",
				workBoardFailedTransition: config.workBoardFailedTransition ?? "",
				workBoardManualTransitions: (config.workBoardManualTransitions ?? []).join(", "),
				workBoardProjectMappings: JSON.stringify(config.workBoardProjectMappings ?? [], null, 2)
			};
		}
		function text(value) {
			const trimmed = value.trim();
			return trimmed.length === 0 ? void 0 : trimmed;
		}
		function projectMappingsFromDraft(value) {
			const trimmed = value.trim();
			if (trimmed.length === 0) return [];
			const parsed = JSON.parse(trimmed);
			if (!Array.isArray(parsed)) throw new Error("Project mappings must be a JSON array.");
			return parsed.flatMap((item) => {
				if (typeof item !== "object" || item === null || Array.isArray(item)) return [];
				const row = item;
				const projectKey = typeof row.projectKey === "string" ? row.projectKey.trim().toUpperCase() : "";
				if (projectKey.length === 0) return [];
				const workspaceId = typeof row.workspaceId === "string" && row.workspaceId.trim().length > 0 ? row.workspaceId.trim() : void 0;
				const mode = typeof row.mode === "string" && row.mode.trim().length > 0 ? row.mode.trim() : void 0;
				const permission = row.permission === "read-only" || row.permission === "workspace-write" || row.permission === "danger-full-access" ? row.permission : void 0;
				return [{
					projectKey,
					...workspaceId === void 0 ? {} : { workspaceId },
					...mode === void 0 ? {} : { mode },
					...permission === void 0 ? {} : { permission }
				}];
			});
		}
		function draftToConfig(draft) {
			const baseUrl = text(draft.baseUrl);
			const tokenCredentialRef = text(draft.tokenCredentialRef);
			const username = text(draft.username);
			const assignedJql = text(draft.assignedJql);
			const watchingJql = text(draft.watchingJql);
			const reportedJql = text(draft.reportedJql);
			const workBoardSyncJql = text(draft.workBoardSyncJql);
			const workBoardDoneTransition = text(draft.workBoardDoneTransition);
			const workBoardFailedTransition = text(draft.workBoardFailedTransition);
			const manualTransitions = draft.workBoardManualTransitions.split(",").map((item) => item.trim()).filter((item) => item.length > 0);
			const workBoardProjectMappings = projectMappingsFromDraft(draft.workBoardProjectMappings);
			return {
				...baseUrl === void 0 ? {} : { baseUrl },
				authMode: draft.authMode,
				...tokenCredentialRef === void 0 ? {} : { tokenCredentialRef },
				...username === void 0 ? {} : { username },
				strictTls: draft.strictTls,
				timeoutMs: draft.timeoutMs,
				maxResults: draft.maxResults,
				...assignedJql === void 0 ? {} : { assignedJql },
				...watchingJql === void 0 ? {} : { watchingJql },
				...reportedJql === void 0 ? {} : { reportedJql },
				workBoardSync: draft.workBoardSync,
				...workBoardSyncJql === void 0 ? {} : { workBoardSyncJql },
				workBoardSyncIntervalMs: draft.workBoardSyncIntervalMs,
				workBoardWriteback: draft.workBoardWriteback,
				...workBoardDoneTransition === void 0 ? {} : { workBoardDoneTransition },
				...workBoardFailedTransition === void 0 ? {} : { workBoardFailedTransition },
				...manualTransitions.length === 0 ? {} : { workBoardManualTransitions: manualTransitions },
				...workBoardProjectMappings.length === 0 ? {} : { workBoardProjectMappings }
			};
		}
		function JiraPanel({ open, onClose, port, t }) {
			const [status, setStatus] = (0, react.useState)();
			const [configView, setConfigView] = (0, react.useState)();
			const [configDraft, setConfigDraft] = (0, react.useState)(() => draftFromConfig({}));
			const [credentialValue, setCredentialValue] = (0, react.useState)("");
			const [view, setView] = (0, react.useState)("assigned");
			const [customJql, setCustomJql] = (0, react.useState)("");
			const [result, setResult] = (0, react.useState)();
			const [selectedKey, setSelectedKey] = (0, react.useState)();
			const [detail, setDetail] = (0, react.useState)();
			const [comment, setComment] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)();
			const [error, setError] = (0, react.useState)();
			const [notice, setNotice] = (0, react.useState)();
			const issue = (0, react.useMemo)(() => selectedIssue(result?.issues ?? [], selectedKey), [result, selectedKey]);
			const loadConfig = async () => {
				setBusy("config");
				setError(void 0);
				try {
					const next = await port.config();
					setConfigView(next);
					setConfigDraft(draftFromConfig(next.effective));
				} catch (nextError) {
					setError(nextError instanceof Error ? nextError.message : String(nextError));
				} finally {
					setBusy(void 0);
				}
			};
			const saveConfig = async () => {
				setBusy("config");
				setError(void 0);
				setNotice(void 0);
				try {
					const next = await port.saveConfig({ config: draftToConfig(configDraft) });
					if (credentialValue.trim().length > 0) {
						await port.saveCredential({
							credentialRef: configDraft.tokenCredentialRef,
							value: credentialValue
						});
						setCredentialValue("");
					}
					setConfigView(next);
					setConfigDraft(draftFromConfig(next.effective));
					setNotice(t("panel.configSaved"));
					await loadStatus();
				} catch (nextError) {
					setError(nextError instanceof Error ? nextError.message : String(nextError));
				} finally {
					setBusy(void 0);
				}
			};
			const loadStatus = async () => {
				setBusy("status");
				setError(void 0);
				try {
					setStatus(await port.status());
				} catch (nextError) {
					setError(nextError instanceof Error ? nextError.message : String(nextError));
				} finally {
					setBusy(void 0);
				}
			};
			const search = async (nextView = view) => {
				setBusy("search");
				setError(void 0);
				setNotice(void 0);
				try {
					const next = await port.search({
						view: nextView,
						...nextView === "custom" ? { jql: customJql } : {}
					});
					setResult(next);
					setSelectedKey((current) => next.issues.some((item) => item.key === current) ? current : next.issues[0]?.key);
					setDetail(void 0);
				} catch (nextError) {
					setError(nextError instanceof Error ? nextError.message : String(nextError));
				} finally {
					setBusy(void 0);
				}
			};
			const loadIssue = async (issueKey) => {
				setBusy("issue");
				setError(void 0);
				try {
					setDetail(await port.getIssue({ issueKey }));
				} catch (nextError) {
					setError(nextError instanceof Error ? nextError.message : String(nextError));
				} finally {
					setBusy(void 0);
				}
			};
			const submitComment = async () => {
				if (detail === void 0 || comment.trim().length === 0) return;
				setBusy("comment");
				setError(void 0);
				setNotice(void 0);
				try {
					const mutation = await port.addComment({
						issueKey: detail.key,
						body: comment.trim()
					});
					setComment("");
					setNotice(mutation.message);
					setDetail(await port.getIssue({ issueKey: detail.key }));
				} catch (nextError) {
					setError(nextError instanceof Error ? nextError.message : String(nextError));
				} finally {
					setBusy(void 0);
				}
			};
			const transition = async (transitionId) => {
				if (detail === void 0) return;
				setBusy("transition");
				setError(void 0);
				setNotice(void 0);
				try {
					const mutation = await port.transitionIssue({
						issueKey: detail.key,
						transitionId
					});
					setNotice(mutation.message);
					setDetail(await port.getIssue({ issueKey: detail.key }));
					await search(view);
				} catch (nextError) {
					setError(nextError instanceof Error ? nextError.message : String(nextError));
				} finally {
					setBusy(void 0);
				}
			};
			(0, react.useEffect)(() => {
				if (!open || status !== void 0 || busy !== void 0) return;
				Promise.all([loadStatus(), loadConfig()]).then(() => {
					search("assigned");
				});
			}, [open]);
			(0, react.useEffect)(() => {
				if (issue === void 0 || detail?.key === issue.key || busy === "issue") return;
				loadIssue(issue.key);
			}, [issue?.key]);
			if (!open) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: JiraPanel_module_css_default.popover,
				role: "dialog",
				"aria-label": t("panel.title"),
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: JiraPanel_module_css_default.header,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: JiraPanel_module_css_default.title,
							children: t("panel.title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: JiraPanel_module_css_default.subtitle,
							children: t("panel.subtitle")
						})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: JiraPanel_module_css_default.iconButton,
							onClick: onClose,
							"aria-label": t("panel.close"),
							children: "×"
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: JiraPanel_module_css_default.statusBox,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: JiraPanel_module_css_default.sectionTitle,
								children: t("panel.status")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: JiraPanel_module_css_default.subtitle,
								children: status === void 0 ? t("panel.loading") : statusLabel(status.status, t)
							})] }),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: JiraPanel_module_css_default.primaryButton,
								disabled: busy !== void 0,
								onClick: () => {
									loadStatus();
								},
								children: busy === "status" ? t("panel.refreshing") : t("panel.refresh")
							}),
							status !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: JiraPanel_module_css_default.configGrid,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.baseUrl") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: status.config.baseUrl ?? "—" }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.credential") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [
										status.config.credentialRef,
										" · ",
										status.credentialConfigured ? "configured" : "missing"
									] }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.user") }),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: status.user?.displayName ?? status.user?.name ?? t("panel.noUser") })
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: JiraPanel_module_css_default.configBox,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: JiraPanel_module_css_default.configHeader,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: JiraPanel_module_css_default.sectionTitle,
								children: t("panel.connectionSettings")
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: JiraPanel_module_css_default.subtitle,
								children: configView === void 0 ? t("panel.loading") : t("panel.configPath", { path: configView.path })
							})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: JiraPanel_module_css_default.primaryButton,
								disabled: busy !== void 0,
								onClick: () => {
									saveConfig();
								},
								children: busy === "config" ? t("panel.saving") : t("panel.saveConfig")
							})]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: JiraPanel_module_css_default.formGrid,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.baseUrl") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									value: configDraft.baseUrl,
									placeholder: "https://jira.example.com",
									onChange: (event) => {
										setConfigDraft((current) => ({
											...current,
											baseUrl: event.target.value
										}));
									}
								})] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.authMode") }), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("select", {
									value: configDraft.authMode,
									onChange: (event) => {
										setConfigDraft((current) => ({
											...current,
											authMode: event.target.value === "basic" ? "basic" : "pat"
										}));
									},
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "pat",
										children: "PAT"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("option", {
										value: "basic",
										children: "Basic"
									})]
								})] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.username") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									value: configDraft.username,
									placeholder: t("panel.usernamePlaceholder"),
									onChange: (event) => {
										setConfigDraft((current) => ({
											...current,
											username: event.target.value
										}));
									}
								})] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.credential") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									value: configDraft.tokenCredentialRef,
									placeholder: "JIRA_API_TOKEN",
									onChange: (event) => {
										setConfigDraft((current) => ({
											...current,
											tokenCredentialRef: event.target.value
										}));
									}
								})] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.credentialValue") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "password",
									value: credentialValue,
									placeholder: t("panel.credentialValuePlaceholder"),
									onChange: (event) => {
										setCredentialValue(event.target.value);
									}
								})] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.timeoutMs") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "number",
									min: 1e3,
									value: configDraft.timeoutMs,
									onChange: (event) => {
										setConfigDraft((current) => ({
											...current,
											timeoutMs: Number(event.target.value)
										}));
									}
								})] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.maxResults") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "number",
									min: 1,
									max: 100,
									value: configDraft.maxResults,
									onChange: (event) => {
										setConfigDraft((current) => ({
											...current,
											maxResults: Number(event.target.value)
										}));
									}
								})] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: JiraPanel_module_css_default.checkboxLabel,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: configDraft.strictTls,
										onChange: (event) => {
											setConfigDraft((current) => ({
												...current,
												strictTls: event.target.checked
											}));
										}
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.strictTls") })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: JiraPanel_module_css_default.checkboxLabel,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: configDraft.workBoardSync,
										onChange: (event) => {
											setConfigDraft((current) => ({
												...current,
												workBoardSync: event.target.checked
											}));
										}
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.workBoardSync") })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: JiraPanel_module_css_default.wideField,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.syncJql") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										value: configDraft.workBoardSyncJql,
										onChange: (event) => {
											setConfigDraft((current) => ({
												...current,
												workBoardSyncJql: event.target.value
											}));
										}
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.syncInterval") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "number",
									min: 3e4,
									step: 1e3,
									value: configDraft.workBoardSyncIntervalMs,
									onChange: (event) => {
										setConfigDraft((current) => ({
											...current,
											workBoardSyncIntervalMs: Number(event.target.value)
										}));
									}
								})] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: JiraPanel_module_css_default.checkboxLabel,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "checkbox",
										checked: configDraft.workBoardWriteback,
										onChange: (event) => {
											setConfigDraft((current) => ({
												...current,
												workBoardWriteback: event.target.checked
											}));
										}
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.workBoardWriteback") })]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.doneTransition") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									value: configDraft.workBoardDoneTransition,
									placeholder: "Done",
									onChange: (event) => {
										setConfigDraft((current) => ({
											...current,
											workBoardDoneTransition: event.target.value
										}));
									}
								})] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.failedTransition") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									value: configDraft.workBoardFailedTransition,
									placeholder: "Blocked",
									onChange: (event) => {
										setConfigDraft((current) => ({
											...current,
											workBoardFailedTransition: event.target.value
										}));
									}
								})] }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: JiraPanel_module_css_default.wideField,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.manualTransitions") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										value: configDraft.workBoardManualTransitions,
										placeholder: "Done, In Progress, Blocked",
										onChange: (event) => {
											setConfigDraft((current) => ({
												...current,
												workBoardManualTransitions: event.target.value
											}));
										}
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
									className: JiraPanel_module_css_default.wideField,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: t("panel.projectMappings") }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
										className: JiraPanel_module_css_default.mappingTextArea,
										value: configDraft.workBoardProjectMappings,
										placeholder: t("panel.projectMappingsPlaceholder"),
										onChange: (event) => {
											setConfigDraft((current) => ({
												...current,
												workBoardProjectMappings: event.target.value
											}));
										}
									})]
								})
							]
						})]
					}),
					error !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: JiraPanel_module_css_default.error,
						children: error
					}),
					notice !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
						className: JiraPanel_module_css_default.notice,
						children: notice
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: JiraPanel_module_css_default.toolbar,
						children: [
							[
								"assigned",
								"watching",
								"reported",
								"custom"
							].map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: clsx(JiraPanel_module_css_default.tabButton, view === item && JiraPanel_module_css_default.tabButtonActive),
								onClick: () => {
									setView(item);
									if (item !== "custom") search(item);
								},
								children: viewLabel(item, t)
							}, item)),
							view === "custom" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								className: JiraPanel_module_css_default.jqlInput,
								value: customJql,
								placeholder: t("panel.customPlaceholder"),
								onChange: (event) => {
									setCustomJql(event.target.value);
								}
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: JiraPanel_module_css_default.primaryButton,
								disabled: busy !== void 0,
								onClick: () => {
									search("custom");
								},
								children: t("panel.search")
							})] }),
							view !== "custom" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: JiraPanel_module_css_default.primaryButton,
								disabled: busy !== void 0,
								onClick: () => {
									search(view);
								},
								children: busy === "search" ? t("panel.refreshing") : t("panel.refresh")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: JiraPanel_module_css_default.content,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: JiraPanel_module_css_default.issueList,
							children: [
								busy === "search" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: JiraPanel_module_css_default.empty,
									children: t("panel.loading")
								}),
								busy !== "search" && (result?.issues.length ?? 0) === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: JiraPanel_module_css_default.empty,
									children: t("panel.noIssues")
								}),
								result?.total !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
									className: JiraPanel_module_css_default.total,
									children: t("panel.total", { count: result.total })
								}),
								result?.issues.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
									type: "button",
									className: clsx(JiraPanel_module_css_default.issueCard, item.key === issue?.key && JiraPanel_module_css_default.issueCardActive),
									onClick: () => {
										setSelectedKey(item.key);
									},
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: JiraPanel_module_css_default.issueKey,
											children: item.key
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: item.summary }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("small", { children: [
											item.status,
											" · ",
											item.assignee ?? "Unassigned",
											" · ",
											dateLabel(item.updated)
										] })
									]
								}, item.key))
							]
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
							className: JiraPanel_module_css_default.detail,
							children: issue === void 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: JiraPanel_module_css_default.empty,
								children: busy === "search" ? t("panel.loading") : t("panel.selectIssue")
							}) : detail === void 0 || detail.key !== issue.key ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: JiraPanel_module_css_default.empty,
								children: t("panel.loading")
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: JiraPanel_module_css_default.detailTop,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
										className: JiraPanel_module_css_default.detailTitle,
										children: [
											detail.key,
											" · ",
											detail.summary
										]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
										className: JiraPanel_module_css_default.detailMeta,
										children: [
											detail.status,
											" · ",
											detail.issueType ?? "Issue",
											" · ",
											dateLabel(detail.updated)
										]
									})] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("a", {
										className: JiraPanel_module_css_default.openLink,
										href: detail.url,
										target: "_blank",
										rel: "noreferrer",
										children: t("panel.open")
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
									className: JiraPanel_module_css_default.section,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: JiraPanel_module_css_default.sectionTitle,
										children: t("panel.description")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: JiraPanel_module_css_default.description,
										children: detail.description ?? t("panel.none")
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
									className: JiraPanel_module_css_default.section,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: JiraPanel_module_css_default.sectionTitle,
										children: t("panel.transitions")
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: JiraPanel_module_css_default.transitions,
										children: [detail.transitions.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: JiraPanel_module_css_default.empty,
											children: t("panel.none")
										}), detail.transitions.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											disabled: busy !== void 0,
											onClick: () => {
												transition(item.id);
											},
											children: busy === "transition" ? t("panel.transitioning") : item.name
										}, item.id))]
									})]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
									className: JiraPanel_module_css_default.section,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: JiraPanel_module_css_default.sectionTitle,
											children: t("panel.addComment")
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("textarea", {
											className: JiraPanel_module_css_default.commentBox,
											value: comment,
											placeholder: t("panel.commentPlaceholder"),
											onChange: (event) => {
												setComment(event.target.value);
											}
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
											type: "button",
											className: JiraPanel_module_css_default.primaryButton,
											disabled: busy !== void 0 || comment.trim().length === 0,
											onClick: () => {
												submitComment();
											},
											children: busy === "comment" ? t("panel.commenting") : t("panel.addComment")
										})
									]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
									className: JiraPanel_module_css_default.section,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: JiraPanel_module_css_default.sectionTitle,
											children: t("panel.comments")
										}),
										detail.comments.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
											className: JiraPanel_module_css_default.empty,
											children: t("panel.none")
										}),
										detail.comments.map((item) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: JiraPanel_module_css_default.comment,
											children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("strong", { children: [
												item.author ?? "Unknown",
												" · ",
												dateLabel(item.updated ?? item.created)
											] }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", { children: item.body })]
										}, item.id))
									]
								})
							] })
						})]
					})
				]
			});
		}
		//#endregion
		//#region src/client/panel-mount.tsx
		const ACTIVE_EVENT = "dsh-panel-activate";
		const PANEL_NAME = "jira-tracker";
		const VIEW_SELECTOR = "[data-dsh-jira-view]";
		var JiraControllerImpl = class {
			port;
			t;
			openState = false;
			listeners = /* @__PURE__ */ new Set();
			root;
			container;
			onOtherActivate = (event) => {
				if (event.detail !== PANEL_NAME && this.openState) this.close();
			};
			onEscape = (event) => {
				if (event.key === "Escape" && this.openState) this.close();
			};
			constructor(port, t) {
				this.port = port;
				this.t = t;
				document.addEventListener(ACTIVE_EVENT, this.onOtherActivate);
				document.addEventListener("keydown", this.onEscape);
			}
			open() {
				if (!this.openState) {
					this.openState = true;
					document.dispatchEvent(new CustomEvent(ACTIVE_EVENT, { detail: PANEL_NAME }));
					this.notify();
				}
				this.render();
			}
			close() {
				if (!this.openState) return;
				this.openState = false;
				this.notify();
				this.render();
			}
			toggle() {
				if (this.openState) this.close();
				else this.open();
			}
			subscribe(listener) {
				this.listeners.add(listener);
				return () => {
					this.listeners.delete(listener);
				};
			}
			isOpen() {
				return this.openState;
			}
			dispose() {
				document.removeEventListener(ACTIVE_EVENT, this.onOtherActivate);
				document.removeEventListener("keydown", this.onEscape);
				this.root?.unmount();
				this.root = void 0;
				this.container?.remove();
				this.container = void 0;
				this.listeners.clear();
			}
			notify() {
				for (const listener of [...this.listeners]) listener();
			}
			ensureContainer() {
				if (this.container !== void 0 && this.container.isConnected) return;
				this.root?.unmount();
				this.container?.remove();
				const existing = document.querySelector(VIEW_SELECTOR);
				this.container = existing ?? document.createElement("div");
				this.container.dataset.dshJiraView = "";
				this.container.dataset.dshPlugin = "dsh-jira";
				this.container.className = JiraPanel_module_css_default.view;
				if (!this.container.isConnected) document.body.appendChild(this.container);
				this.root = (0, react_dom_client.createRoot)(this.container);
			}
			render() {
				this.ensureContainer();
				this.root?.render(/* @__PURE__ */ (0, react_jsx_runtime.jsx)(JiraPanel, {
					open: this.openState,
					onClose: () => {
						this.close();
					},
					port: this.port,
					t: this.t
				}));
			}
		};
		function createJiraController(port, t) {
			const controller = new JiraControllerImpl(port, t);
			controller.close();
			return controller;
		}
		//#endregion
		//#region src/client/sidebar-entry-core.ts
		function sidebarRoot() {
			const column = document.querySelector("[data-pane=\"sidebar\"], [class*=\"sidebarCol\"]");
			if (column === null) return void 0;
			return column.querySelector("[class*=\"logoRow\"]")?.parentElement ?? column.firstElementChild;
		}
		function newSessionButton(root) {
			const nested = root.querySelector("button[class*=\"newSession\"]");
			if (nested !== null) return nested;
			for (const child of root.children) if (child.tagName === "BUTTON") return child;
		}
		function createEntry(options) {
			const entry = document.createElement("button");
			entry.type = "button";
			entry.setAttribute(options.rowAttribute, "");
			if (options.plugin !== void 0) {
				entry.setAttribute("data-dsh-plugin", options.plugin);
				entry.setAttribute("data-dsh-part", "sidebar-entry");
			}
			entry.className = options.css.entry ?? "";
			entry.setAttribute("aria-label", options.label());
			if (options.tooltip !== void 0) entry.setAttribute("title", options.tooltip());
			entry.innerHTML = "<span class=\"" + (options.css.entryIcon ?? "") + "\">" + options.icon + "</span><span class=\"" + (options.css.entryLabel ?? "") + "\">" + options.label() + "</span>";
			entry.addEventListener("click", options.onToggle);
			return entry;
		}
		function placeEntry(root, entry, options) {
			const button = newSessionButton(root);
			if (button === void 0) return false;
			if (entry.parentElement !== root) {
				const row = button.closest("[class*=\"logoRow\"]");
				const base = row !== null && row.parentElement === root ? row : button;
				const family = Array.from(root.children).filter((el) => el instanceof HTMLElement && el.matches(options.familySelectors.join(", ")));
				const anchor = options.position === "before" ? family.length > 0 ? family[0] : base.nextElementSibling : family.length > 0 ? family[family.length - 1].nextElementSibling : base.nextElementSibling;
				root.insertBefore(entry, anchor);
			}
			return true;
		}
		function mountSidebarEntry$1(options) {
			if (typeof document !== "undefined" && document.querySelector(options.rowSelector) !== null) return () => {};
			const entry = createEntry(options);
			let root;
			let placed = false;
			const rootObserver = new MutationObserver(() => {
				if (root === void 0 || !root.isConnected) {
					placed = false;
					tryPlace();
					return;
				}
				if (!root.contains(entry)) placed = placeEntry(root, entry, options);
			});
			const tryPlace = () => {
				if (root !== void 0 && !root.isConnected) {
					rootObserver.disconnect();
					root = void 0;
					placed = false;
				}
				if (placed) {
					if (document.body.contains(entry)) return;
					rootObserver.disconnect();
					root = void 0;
					placed = false;
				}
				root ??= sidebarRoot();
				if (root === void 0) return;
				placed = placeEntry(root, entry, options);
				if (placed) rootObserver.observe(root, {
					childList: true,
					subtree: true
				});
			};
			const waitObserver = new MutationObserver(() => {
				tryPlace();
			});
			waitObserver.observe(document.body, {
				childList: true,
				subtree: true
			});
			const unsubscribeActive = options.active === void 0 ? void 0 : (() => {
				const syncActive = () => {
					if (options.active.isOpen()) entry.dataset.active = "true";
					else delete entry.dataset.active;
				};
				const unsubscribe = options.active.subscribe(syncActive);
				syncActive();
				return unsubscribe;
			})();
			tryPlace();
			return () => {
				waitObserver.disconnect();
				rootObserver.disconnect();
				unsubscribeActive?.();
				entry.remove();
			};
		}
		//#endregion
		//#region src/client/sidebar-entry.ts
		const ENTRY_SELECTOR = "[data-dsh-jira-entry]";
		const ICON = "<svg viewBox=\"0 0 16 16\" width=\"14\" height=\"14\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"1.35\" stroke-linecap=\"round\" stroke-linejoin=\"round\" aria-hidden=\"true\"><path d=\"M4.2 2.2h5.9l2 2v9.6H4.2z\"/><path d=\"M10.1 2.2v2h2\"/><path d=\"M6.2 7h4\"/><path d=\"M6.2 9.4h3\"/><path d=\"M2 4.2h2.2\"/><path d=\"M2 7.4h2.2\"/><path d=\"M2 10.6h2.2\"/></svg>";
		function mountSidebarEntry(controller, t) {
			return mountSidebarEntry$1({
				rowAttribute: "data-dsh-jira-entry",
				rowSelector: ENTRY_SELECTOR,
				plugin: "dsh-jira",
				icon: ICON,
				css: JiraPanel_module_css_default,
				label: () => t("panel.trigger"),
				tooltip: () => t("panel.title"),
				onToggle: () => {
					controller.toggle();
				},
				position: "after",
				familySelectors: [
					"[data-dsh-taskboard-entry]",
					"[data-dsh-ssh-entry]",
					"[data-dsh-release-console-entry]",
					"[data-dsh-jira-entry]"
				],
				active: {
					subscribe: (listener) => controller.subscribe(listener),
					isOpen: () => controller.isOpen()
				}
			});
		}
		//#endregion
		//#region src/client/locales.ts
		const NS = "jiraTracker";
		const zh = {
			"panel.trigger": "Jira",
			"panel.title": "Jira Issue 跟踪",
			"panel.subtitle": "查看内网 Jira 指派、关注、报告和自定义 JQL 结果。",
			"panel.close": "关闭 Jira 面板",
			"panel.refresh": "刷新",
			"panel.refreshing": "刷新中…",
			"panel.status": "连接状态",
			"panel.configMissing": "还没有配置 Jira baseUrl。",
			"panel.credentialMissing": "还没有配置 Jira 凭据。",
			"panel.configured": "连接已配置",
			"panel.error": "连接错误",
			"panel.baseUrl": "Base URL",
			"panel.credential": "凭据",
			"panel.user": "用户",
			"panel.noUser": "未读取用户",
			"panel.assigned": "指派给我",
			"panel.watching": "我关注的",
			"panel.reported": "我报告的",
			"panel.custom": "自定义 JQL",
			"panel.search": "搜索",
			"panel.noIssues": "没有 issue。",
			"panel.loading": "正在加载…",
			"panel.selectIssue": "选择一个 issue 查看详情。",
			"panel.comments": "最近评论",
			"panel.transitions": "可用流转",
			"panel.open": "打开 Jira",
			"panel.description": "描述",
			"panel.none": "无",
			"panel.addComment": "添加评论",
			"panel.commentPlaceholder": "写一条评论…",
			"panel.transition": "流转",
			"panel.commenting": "评论中…",
			"panel.transitioning": "流转中…",
			"panel.customPlaceholder": "project = ABC ORDER BY updated DESC",
			"panel.total": "共 {count} 个",
			"panel.connectionSettings": "连接与同步配置",
			"panel.saveConfig": "保存配置",
			"panel.saving": "保存中…",
			"panel.configSaved": "Jira 配置已保存",
			"panel.configPath": "保存到 {path}",
			"panel.authMode": "认证方式",
			"panel.username": "用户名",
			"panel.usernamePlaceholder": "Basic 认证时填写",
			"panel.credentialValue": "Token / 密码",
			"panel.credentialValuePlaceholder": "留空则不修改已保存凭据",
			"panel.timeoutMs": "超时 ms",
			"panel.maxResults": "最大结果数",
			"panel.strictTls": "严格 TLS",
			"panel.workBoardSync": "同步到 Work Board",
			"panel.syncJql": "同步 JQL",
			"panel.syncInterval": "同步间隔 ms",
			"panel.workBoardWriteback": "执行结果写回 Jira",
			"panel.doneTransition": "成功后流转",
			"panel.failedTransition": "失败后流转",
			"panel.manualTransitions": "常用流转（逗号分隔）",
			"panel.projectMappings": "项目映射 JSON",
			"panel.projectMappingsPlaceholder": "[{\n  \"projectKey\": \"APP\",\n  \"workspaceId\": \"/path-or-workspace-id\",\n  \"mode\": \"default\",\n  \"permission\": \"workspace-write\"\n}]"
		};
		const en = {
			"panel.trigger": "Jira",
			"panel.title": "Jira Issue Tracker",
			"panel.subtitle": "Track assigned, watched, reported, and custom JQL issues from internal Jira.",
			"panel.close": "Close Jira panel",
			"panel.refresh": "Refresh",
			"panel.refreshing": "Refreshing…",
			"panel.status": "Connection status",
			"panel.configMissing": "Jira baseUrl is not configured yet.",
			"panel.credentialMissing": "Jira credential is not configured yet.",
			"panel.configured": "Connection configured",
			"panel.error": "Connection error",
			"panel.baseUrl": "Base URL",
			"panel.credential": "Credential",
			"panel.user": "User",
			"panel.noUser": "No user loaded",
			"panel.assigned": "Assigned to me",
			"panel.watching": "Watching",
			"panel.reported": "Reported by me",
			"panel.custom": "Custom JQL",
			"panel.search": "Search",
			"panel.noIssues": "No issues.",
			"panel.loading": "Loading…",
			"panel.selectIssue": "Select an issue to view details.",
			"panel.comments": "Recent comments",
			"panel.transitions": "Available transitions",
			"panel.open": "Open Jira",
			"panel.description": "Description",
			"panel.none": "None",
			"panel.addComment": "Add comment",
			"panel.commentPlaceholder": "Write a comment…",
			"panel.transition": "Transition",
			"panel.commenting": "Commenting…",
			"panel.transitioning": "Transitioning…",
			"panel.customPlaceholder": "project = ABC ORDER BY updated DESC",
			"panel.total": "{count} total",
			"panel.connectionSettings": "Connection & sync settings",
			"panel.saveConfig": "Save config",
			"panel.saving": "Saving…",
			"panel.configSaved": "Jira config saved",
			"panel.configPath": "Saved to {path}",
			"panel.authMode": "Auth mode",
			"panel.username": "Username",
			"panel.usernamePlaceholder": "Required for Basic auth",
			"panel.credentialValue": "Token / password",
			"panel.credentialValuePlaceholder": "Leave blank to keep the saved credential",
			"panel.timeoutMs": "Timeout ms",
			"panel.maxResults": "Max results",
			"panel.strictTls": "Strict TLS",
			"panel.workBoardSync": "Sync to Work Board",
			"panel.syncJql": "Sync JQL",
			"panel.syncInterval": "Sync interval ms",
			"panel.workBoardWriteback": "Write results back to Jira",
			"panel.doneTransition": "Success transition",
			"panel.failedTransition": "Failure transition",
			"panel.manualTransitions": "Common transitions (comma-separated)",
			"panel.projectMappings": "Project mappings JSON",
			"panel.projectMappingsPlaceholder": "[{\n  \"projectKey\": \"APP\",\n  \"workspaceId\": \"/path-or-workspace-id\",\n  \"mode\": \"default\",\n  \"permission\": \"workspace-write\"\n}]"
		};
		//#endregion
		//#region src/client/index.ts
		const inject = ["locale", "connection"];
		function unwrapResult(endpoint, result) {
			if (result.ok) return result.value;
			throw new Error(`${endpoint}: ${result.error.code}: ${result.error.message}`);
		}
		function createPort(connection) {
			const call = async (endpoint, payload = {}) => {
				return unwrapResult(endpoint, await connection.rpc.call(JIRA_RPC_CHANNEL, endpoint, payload));
			};
			return {
				status: () => call("status"),
				config: () => call("config"),
				saveConfig: (args) => call("saveConfig", args),
				saveCredential: (args) => call("saveCredential", args),
				search: (args) => call("search", args),
				getIssue: (args) => call("getIssue", args),
				getTransitions: (args) => call("getTransitions", args),
				addComment: (args) => call("addComment", args),
				transitionIssue: (args) => call("transitionIssue", args)
			};
		}
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "jira-tracker: dictionaries");
			const port = createPort(ctx.get("connection"));
			const t = ctx.locale.bind(NS);
			const controller = createJiraController(port, t);
			const disposeEntry = mountSidebarEntry(controller, t);
			ctx.effect(() => () => {
				disposeEntry();
				controller.dispose();
			}, "jira-tracker: sidebar entry and panel");
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map