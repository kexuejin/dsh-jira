import { readFile } from 'node:fs/promises'
import { request as requestHttp } from 'node:http'
import { request as requestHttps } from 'node:https'
import { Agent as HttpAgent } from 'node:http'
import { Agent as HttpsAgent } from 'node:https'
import type { IncomingHttpHeaders, RequestOptions } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import type { CredentialRef } from '@deepseek-ai/dsh-credentials'
import type {
  JiraAddCommentArgs,
  JiraAuthMode,
  JiraComment,
  JiraConnectionConfigView,
  JiraConnectionStatusView,
  JiraGetIssueArgs,
  JiraIssueDetail,
  JiraIssueSummary,
  JiraIssueView,
  JiraMutationResult,
  JiraSearchArgs,
  JiraSearchResult,
  JiraTransition,
  JiraTransitionIssueArgs,
  JiraUser,
} from './model.ts'

export interface Config {
  readonly baseUrl?: string
  readonly authMode?: JiraAuthMode
  readonly tokenCredentialRef?: string
  readonly username?: string
  readonly strictTls?: boolean
  readonly caCertificatePath?: string
  readonly proxyUrl?: string
  readonly timeoutMs?: number
  readonly maxResults?: number
  readonly assignedJql?: string
  readonly watchingJql?: string
  readonly reportedJql?: string
}

export interface ResolvedConfig {
  readonly baseUrl?: string
  readonly authMode: JiraAuthMode
  readonly tokenCredentialRef: CredentialRef
  readonly username?: string
  readonly strictTls: boolean
  readonly caCertificatePath?: string
  readonly proxyUrl?: string
  readonly timeoutMs: number
  readonly maxResults: number
  readonly assignedJql: string
  readonly watchingJql: string
  readonly reportedJql: string
}

interface JiraRequestOptions {
  readonly method?: string
  readonly path: string
  readonly query?: Readonly<Record<string, string | number | boolean | undefined>>
  readonly body?: unknown
}

interface JiraSearchResponse {
  readonly startAt?: number
  readonly maxResults?: number
  readonly total?: number
  readonly issues?: readonly unknown[]
}

const DEFAULT_CREDENTIAL_REF = 'JIRA_API_TOKEN'
const DEFAULT_TIMEOUT_MS = 15000
const DEFAULT_MAX_RESULTS = 25
const DESCRIPTION_FIELDS = ['summary', 'status', 'statusCategory', 'issuetype', 'priority', 'assignee', 'reporter', 'updated', 'created']
const DETAIL_FIELDS = [...DESCRIPTION_FIELDS, 'description', 'comment']

export function resolveConfig(config: Config = {}): ResolvedConfig {
  const authMode = config.authMode ?? 'pat'
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const maxResults = config.maxResults ?? DEFAULT_MAX_RESULTS
  if (timeoutMs < 1000) throw new Error('jira timeoutMs must be at least 1000')
  if (maxResults < 1 || maxResults > 100) throw new Error('jira maxResults must be between 1 and 100')
  const credential = credentialRef(config.tokenCredentialRef ?? DEFAULT_CREDENTIAL_REF)
  const baseUrl = normalizeBaseUrl(config.baseUrl)
  const username = cleanOptional(config.username)
  const caCertificatePath = cleanOptional(config.caCertificatePath)
  const proxyUrl = cleanOptional(config.proxyUrl)
  return {
    ...baseUrl === undefined ? {} : { baseUrl },
    authMode,
    tokenCredentialRef: credential,
    ...username === undefined ? {} : { username },
    strictTls: config.strictTls ?? true,
    ...caCertificatePath === undefined ? {} : { caCertificatePath },
    ...proxyUrl === undefined ? {} : { proxyUrl },
    timeoutMs,
    maxResults,
    assignedJql: cleanOptional(config.assignedJql) ?? 'assignee = currentUser() ORDER BY updated DESC',
    watchingJql: cleanOptional(config.watchingJql) ?? 'watcher = currentUser() ORDER BY updated DESC',
    reportedJql: cleanOptional(config.reportedJql) ?? 'reporter = currentUser() ORDER BY updated DESC',
  }
}

function cleanOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed
}

function normalizeBaseUrl(value: string | undefined): string | undefined {
  const trimmed = cleanOptional(value)
  if (trimmed === undefined) return undefined
  const parsed = new URL(trimmed)
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('jira baseUrl must use http or https')
  parsed.pathname = parsed.pathname.replace(/\/+$/u, '')
  parsed.search = ''
  parsed.hash = ''
  return parsed.toString().replace(/\/$/u, '')
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringField(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function numberField(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function arrayField(value: unknown): readonly unknown[] {
  return Array.isArray(value) ? value : []
}

function truncate(value: string, max = 20000): string {
  return value.length <= max ? value : `${value.slice(0, max)}… [truncated]`
}

function redactedHttpError(method: string, target: URL, statusCode: number, body: string): Error {
  const message = body.length > 0 ? `: ${truncate(body, 800)}` : ''
  return new Error(`${method} ${target.origin}${target.pathname} failed with ${String(statusCode)}${message}`)
}

function appendQuery(target: URL, query: JiraRequestOptions['query']): void {
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) target.searchParams.set(key, String(value))
  }
}

function userLabel(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined
  return stringField(value.displayName) ?? stringField(value.name) ?? stringField(value.key) ?? stringField(value.emailAddress)
}

function userObject(value: unknown): JiraUser | undefined {
  if (!isRecord(value)) return undefined
  const key = stringField(value.key)
  const name = stringField(value.name)
  const displayName = stringField(value.displayName)
  const emailAddress = stringField(value.emailAddress)
  return {
    ...(key === undefined ? {} : { key }),
    ...(name === undefined ? {} : { name }),
    ...(displayName === undefined ? {} : { displayName }),
    ...(emailAddress === undefined ? {} : { emailAddress }),
    ...(typeof value.active === 'boolean' ? { active: value.active } : {}),
  }
}

function textFromDoc(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'string') return value
  if (Array.isArray(value)) return value.map(textFromDoc).filter((part): part is string => part !== undefined).join('\n')
  if (!isRecord(value)) return undefined
  if (typeof value.text === 'string') return value.text
  const content = arrayField(value.content).map(textFromDoc).filter((part): part is string => part !== undefined).join('\n')
  return content.length === 0 ? undefined : content
}

function issueFields(raw: Record<string, unknown>): Record<string, unknown> {
  return isRecord(raw.fields) ? raw.fields : {}
}

function issueUrl(baseUrl: string, key: string): string {
  return `${baseUrl}/browse/${encodeURIComponent(key)}`
}

export function normalizeIssueSummary(baseUrl: string, raw: unknown): JiraIssueSummary {
  if (!isRecord(raw)) throw new Error('jira issue must be an object')
  const key = stringField(raw.key)
  if (key === undefined) throw new Error('jira issue is missing key')
  const id = stringField(raw.id)
  const fields = issueFields(raw)
  const status = isRecord(fields.status) ? stringField(fields.status.name) : undefined
  const statusCategory = isRecord(fields.status) && isRecord(fields.status.statusCategory) ? stringField(fields.status.statusCategory.name) : undefined
  const issueType = isRecord(fields.issuetype) ? stringField(fields.issuetype.name) : undefined
  const priority = isRecord(fields.priority) ? stringField(fields.priority.name) : undefined
  const assignee = userLabel(fields.assignee)
  const reporter = userLabel(fields.reporter)
  const updated = stringField(fields.updated)
  const created = stringField(fields.created)
  return {
    key,
    ...(id === undefined ? {} : { id }),
    summary: stringField(fields.summary) ?? '(no summary)',
    status: status ?? 'Unknown',
    ...(statusCategory === undefined ? {} : { statusCategory }),
    ...(issueType === undefined ? {} : { issueType }),
    ...(priority === undefined ? {} : { priority }),
    ...(assignee === undefined ? {} : { assignee }),
    ...(reporter === undefined ? {} : { reporter }),
    ...(updated === undefined ? {} : { updated }),
    ...(created === undefined ? {} : { created }),
    url: issueUrl(baseUrl, key),
  }
}

function normalizeComment(raw: unknown): JiraComment | undefined {
  if (!isRecord(raw)) return undefined
  const id = stringField(raw.id)
  if (id === undefined) return undefined
  const body = textFromDoc(raw.body) ?? ''
  const author = userLabel(raw.author)
  const created = stringField(raw.created)
  const updated = stringField(raw.updated)
  return {
    id,
    ...(author === undefined ? {} : { author }),
    ...(created === undefined ? {} : { created }),
    ...(updated === undefined ? {} : { updated }),
    body: truncate(body, 5000),
  }
}

function normalizeTransition(raw: unknown): JiraTransition | undefined {
  if (!isRecord(raw)) return undefined
  const id = stringField(raw.id)
  const name = stringField(raw.name)
  if (id === undefined || name === undefined) return undefined
  const to = isRecord(raw.to) ? stringField(raw.to.name) : undefined
  return {
    id,
    name,
    ...to === undefined ? {} : { to },
  }
}

function normalizeIssueDetail(baseUrl: string, raw: unknown, transitions: readonly JiraTransition[]): JiraIssueDetail {
  const summary = normalizeIssueSummary(baseUrl, raw)
  const fields = isRecord(raw) ? issueFields(raw) : {}
  const commentRoot = isRecord(fields.comment) ? fields.comment : {}
  const comments = arrayField(commentRoot.comments).map(normalizeComment).filter((item): item is JiraComment => item !== undefined)
  return {
    ...summary,
    ...textFromDoc(fields.description) === undefined ? {} : { description: truncate(textFromDoc(fields.description) ?? '', 10000) },
    comments,
    transitions,
  }
}

function buildCommentBody(body: string): string {
  return body
}

function buildAuthHeader(config: ResolvedConfig, token: string): string {
  if (config.authMode === 'pat') return `Bearer ${token}`
  if (config.username === undefined) throw new Error('jira username is required for basic auth')
  return `Basic ${Buffer.from(`${config.username}:${token}`).toString('base64')}`
}

async function caOption(config: ResolvedConfig): Promise<string | undefined> {
  if (config.caCertificatePath === undefined) return undefined
  return await readFile(config.caCertificatePath, 'utf8')
}

function agentFor(target: URL, config: ResolvedConfig, ca: string | undefined): HttpAgent | HttpsAgent | undefined {
  if (target.protocol === 'http:') return undefined
  return new HttpsAgent({ rejectUnauthorized: config.strictTls, ...ca === undefined ? {} : { ca } })
}

function requestJson(target: URL, options: RequestOptions, body: string | undefined, timeoutMs: number): Promise<{ readonly statusCode: number; readonly headers: IncomingHttpHeaders; readonly body: string }> {
  const client = target.protocol === 'https:' ? requestHttps : requestHttp
  return new Promise((resolve, reject) => {
    const request = client(target, options, (response) => {
      response.setEncoding('utf8')
      let responseBody = ''
      response.on('data', (chunk) => { responseBody += chunk })
      response.on('end', () => {
        resolve({ statusCode: response.statusCode ?? 0, headers: response.headers, body: responseBody })
      })
    })
    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`jira request timed out after ${String(timeoutMs)}ms`))
    })
    request.on('error', reject)
    if (body !== undefined) request.write(body)
    request.end()
  })
}

export class JiraClient {
  constructor(
    private readonly ctx: Context,
    private readonly config: ResolvedConfig,
  ) {}

  configView(): JiraConnectionConfigView {
    return {
      ...this.config.baseUrl === undefined ? {} : { baseUrl: this.config.baseUrl },
      authMode: this.config.authMode,
      credentialRef: this.config.tokenCredentialRef,
      ...this.config.username === undefined ? {} : { username: this.config.username },
      strictTls: this.config.strictTls,
      ...this.config.caCertificatePath === undefined ? {} : { caCertificatePath: this.config.caCertificatePath },
      ...this.config.proxyUrl === undefined ? {} : { proxyUrl: this.config.proxyUrl },
      timeoutMs: this.config.timeoutMs,
      maxResults: this.config.maxResults,
    }
  }

  async status(): Promise<JiraConnectionStatusView> {
    const credentialConfigured = await this.hasCredential()
    if (this.config.baseUrl === undefined) {
      return { status: 'missing-config', config: this.configView(), credentialConfigured, message: 'Set jira baseUrl in the dsh-jira plugin config.' }
    }
    if (!credentialConfigured) {
      return { status: 'missing-credential', config: this.configView(), credentialConfigured, message: `Set credential ${this.config.tokenCredentialRef}.` }
    }
    try {
      const user = userObject(await this.request({ path: '/rest/api/2/myself' }))
      return { status: 'configured', config: this.configView(), credentialConfigured, message: 'Jira connection is configured.', ...user === undefined ? {} : { user } }
    } catch (error) {
      return { status: 'error', config: this.configView(), credentialConfigured, message: errorMessage(error) }
    }
  }

  async search(args: JiraSearchArgs): Promise<JiraSearchResult> {
    const jql = this.jqlFor(args)
    const maxResults = Math.min(Math.max(args.maxResults ?? this.config.maxResults, 1), this.config.maxResults)
    const startAt = Math.max(args.startAt ?? 0, 0)
    const response = await this.request({
      path: '/rest/api/2/search',
      query: {
        jql,
        startAt,
        maxResults,
        fields: DESCRIPTION_FIELDS.join(','),
      },
    }) as JiraSearchResponse
    const baseUrl = this.requireBaseUrl()
    const total = numberField(response.total)
    return {
      jql,
      startAt: response.startAt ?? startAt,
      maxResults: response.maxResults ?? maxResults,
      ...(total === undefined ? {} : { total }),
      issues: arrayField(response.issues).map(issue => normalizeIssueSummary(baseUrl, issue)),
    }
  }

  /** List transitions currently available on an issue (for board UIs). */
  async listTransitions(args: { issueKey: string }): Promise<readonly JiraTransition[]> {
    return this.transitions(issueKeyArg(args.issueKey))
  }

  async getIssue(args: JiraGetIssueArgs): Promise<JiraIssueDetail> {
    const issueKey = issueKeyArg(args.issueKey)
    const [issue, transitions] = await Promise.all([
      this.request({
        path: `/rest/api/2/issue/${encodeURIComponent(issueKey)}`,
        query: { fields: DETAIL_FIELDS.join(',') },
      }),
      this.transitions(issueKey),
    ])
    return normalizeIssueDetail(this.requireBaseUrl(), issue, transitions)
  }

  async addComment(args: JiraAddCommentArgs): Promise<JiraMutationResult> {
    const issueKey = issueKeyArg(args.issueKey)
    const body = cleanRequired(args.body, 'comment body')
    await this.request({
      method: 'POST',
      path: `/rest/api/2/issue/${encodeURIComponent(issueKey)}/comment`,
      body: { body: buildCommentBody(body) },
    })
    return { issueKey, status: 'commented', message: `Added comment to ${issueKey}.` }
  }

  async transitionIssue(args: JiraTransitionIssueArgs): Promise<JiraMutationResult> {
    const issueKey = issueKeyArg(args.issueKey)
    const transitions = await this.transitions(issueKey)
    const transition = this.matchTransition(transitions, args.transitionId, args.transitionName)
    await this.request({
      method: 'POST',
      path: `/rest/api/2/issue/${encodeURIComponent(issueKey)}/transitions`,
      body: {
        transition: { id: transition.id },
        ...args.comment === undefined || args.comment.trim().length === 0 ? {} : {
          update: { comment: [{ add: { body: buildCommentBody(args.comment.trim()) } }] },
        },
      },
    })
    return { issueKey, status: transition.to ?? transition.name, message: `Transitioned ${issueKey} via ${transition.name}.` }
  }

  private jqlFor(args: JiraSearchArgs): string {
    if (args.view === 'assigned' || args.view === undefined) return cleanOptional(args.jql) ?? this.config.assignedJql
    if (args.view === 'watching') return cleanOptional(args.jql) ?? this.config.watchingJql
    if (args.view === 'reported') return cleanOptional(args.jql) ?? this.config.reportedJql
    return cleanRequired(args.jql, 'jql')
  }

  private async transitions(issueKey: string): Promise<readonly JiraTransition[]> {
    const result = await this.request({ path: `/rest/api/2/issue/${encodeURIComponent(issueKey)}/transitions` })
    const transitions = isRecord(result) ? arrayField(result.transitions) : []
    return transitions.map(normalizeTransition).filter((item): item is JiraTransition => item !== undefined)
  }

  private matchTransition(transitions: readonly JiraTransition[], id: string | undefined, name: string | undefined): JiraTransition {
    const cleanId = cleanOptional(id)
    if (cleanId !== undefined) {
      const matched = transitions.find(transition => transition.id === cleanId)
      if (matched !== undefined) return matched
    }
    const cleanName = cleanOptional(name)?.toLowerCase()
    if (cleanName !== undefined) {
      const matched = transitions.find(transition => transition.name.toLowerCase() === cleanName)
      if (matched !== undefined) return matched
    }
    const available = transitions.map(transition => `${transition.id}:${transition.name}`).join(', ')
    throw new Error(`jira transition not found; available transitions: ${available || 'none'}`)
  }

  private async hasCredential(): Promise<boolean> {
    const token = await this.resolveToken()
    return token !== undefined
  }

  private async resolveToken(): Promise<string | undefined> {
    const credentials = this.ctx.get('credentials')
    if (credentials !== undefined) return (await credentials.resolve(this.config.tokenCredentialRef))?.value
    const value = process.env[this.config.tokenCredentialRef]
    return value === undefined || value.length === 0 ? undefined : value
  }

  private requireBaseUrl(): string {
    if (this.config.baseUrl === undefined) throw new Error('jira baseUrl is not configured')
    return this.config.baseUrl
  }

  private async request(options: JiraRequestOptions): Promise<unknown> {
    const baseUrl = this.requireBaseUrl()
    if (this.config.proxyUrl !== undefined) throw new Error('jira proxyUrl is configured but proxy transport is not implemented yet')
    const token = await this.resolveToken()
    if (token === undefined) throw new Error(`jira credential ${this.config.tokenCredentialRef} is not configured`)
    const target = new URL(options.path, `${baseUrl}/`)
    appendQuery(target, options.query)
    const method = options.method ?? 'GET'
    const body = options.body === undefined ? undefined : JSON.stringify(options.body)
    const ca = await caOption(this.config)
    const agent = agentFor(target, this.config, ca)
    const headers: Record<string, string> = {
      authorization: buildAuthHeader(this.config, token),
      accept: 'application/json',
      'user-agent': 'dsh-jira/0.1.0',
      ...body === undefined ? {} : { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(body)) },
    }
    const response = await requestJson(target, {
      method,
      headers,
      agent,
    }, body, this.config.timeoutMs)
    if ((response.statusCode >= 300 && response.statusCode < 400) || response.headers.location !== undefined) {
      throw new Error(`${method} ${target.origin}${target.pathname} redirected; credential-bearing Jira requests never follow redirects`)
    }
    if (response.statusCode < 200 || response.statusCode >= 300) throw redactedHttpError(method, target, response.statusCode, response.body)
    if (response.body.trim().length === 0) return {}
    try {
      return JSON.parse(response.body) as unknown
    } catch {
      throw new Error(`${method} ${target.origin}${target.pathname} returned non-JSON response`)
    }
  }
}

function cleanRequired(value: string | undefined, label: string): string {
  const trimmed = cleanOptional(value)
  if (trimmed === undefined) throw new Error(`jira ${label} is required`)
  return trimmed
}

function issueKeyArg(value: string): string {
  const trimmed = cleanRequired(value, 'issue key')
  if (!/^[A-Z][A-Z0-9]+-\d+$/u.test(trimmed)) throw new Error(`invalid jira issue key: ${trimmed}`)
  return trimmed
}

export function createJiraClient(ctx: Context, config: Config): JiraClient {
  return new JiraClient(ctx, resolveConfig(config))
}

export const internals = {
  buildAuthHeader,
  normalizeIssueSummary,
  resolveConfig,
}
