# Jira Plugin Design

## Goal

Build `dsh-jira` as an out-of-tree DSH Web plugin for self-managed Jira deployments on an internal network. The plugin gives the user a first-level Jira entry in the DSH Web sidebar and gives agents a small set of Jira tools for issue lookup and deliberate issue updates.

## Target Jira Deployment

The first supported target is Jira Data Center or Jira Server reachable from the host running DSH. The plugin treats Jira Cloud as a later compatibility path because internal deployments commonly use `/rest/api/2` endpoints, bearer personal access tokens, private DNS, internal TLS, and network proxy rules. Jira Data Center documents JQL search under `/rest/api/2/search`; its issue API includes comments, watchers, transitions, and related issue resources under `/rest/api/2/issue/{issueIdOrKey}`.

## Product Scope

The MVP is a personal issue tracker, not a full Jira administration client. The Web UI includes four views: assigned to me, watching, reported by me, and custom JQL. Each issue row shows key, summary, status, assignee, priority, updated time, and a link back to Jira. The detail panel shows description text, recent comments, available transitions, and minimal metadata needed to decide the next action.

## Agent Tools

The plugin registers `jira_search_issues`, `jira_get_issue`, `jira_add_comment`, and `jira_transition_issue`. Search accepts JQL plus pagination limits and returns capped issue summaries. Get issue returns one issue with selected fields and recent comments. Comment and transition require an explicit issue key; transition requires a transition id or exact transition name from the issue's available transition list. The tools never perform bulk mutations.

## Authentication

The primary auth mode is a Jira Data Center personal access token sent as `Authorization: Bearer <token>`. The plugin also leaves room for HTTP Basic authentication for older internal deployments, but Basic is not the recommended first path.

Credentials stay on the host side through DSH credential references. The Web Client receives only connection status, selected base URL, username/display name when available, and safe errors. Tokens, passwords, session cookies, and raw authorization headers are never returned to the browser, written to ordinary logs, or included in model-visible tool results.

## Host Design

The Host plugin owns Jira configuration, credential resolution, request execution, response normalization, and safety checks. It exposes a loopback GUI RPC surface for the browser panel and registers agent tools through the DSH tool registry. Requests are bounded by timeout, pagination, and response-size limits. The normalizer emits owned issue records with stable fields rather than forwarding Jira's raw JSON objects.

## Web Design

The Client plugin injects a first-level Jira sidebar entry like the existing local Web plugins that do not yet have a shared top-sidebar slot. The panel renders inside its own body-level container, opens without leaving the current DSH session, and refreshes views on demand. A configuration area shows whether the Jira base URL and credential reference are present, but sensitive values are edited through the existing DSH settings or credentials path rather than exposed inline.

## Network and Internal Deployment Handling

The plugin assumes the DSH host may be the only process that can reach Jira. All Jira traffic originates from Host code, not the browser. Configuration includes `baseUrl`, optional `strictTls`, optional `caCertificatePath`, optional `proxyUrl`, request timeout, and default JQL clauses. TLS failures fail closed with a diagnostic that names the setting to fix. The plugin does not disable TLS verification by default.

## Error Handling

Authentication failures return a redacted credential diagnostic. Authorization failures name the denied issue key or operation without revealing protected fields. JQL errors return Jira's visible error messages after truncation. Network errors distinguish DNS, connection refusal, TLS, timeout, and non-JSON Jira responses where Node exposes that distinction. Mutation tools return the resulting issue key and status or a redacted failure.

## Testing

Host unit tests cover request construction, PAT and Basic header selection, redaction, JQL view construction, pagination caps, issue normalization, comment payloads, and transition matching. Client tests cover rendering configured, unconfigured, loading, empty, and error states. A real-composition test boots the plugin through the DSH Loader with mocked Jira HTTP responses and verifies that the tool names and Web plugin are contributed. The first implementation should include a built smoke check for the out-of-tree plugin package.

## Out of Scope

The MVP does not create issues, edit fields, upload attachments, run bulk updates, administer projects, mirror Jira into local storage, or expose Jira data to the model outside explicit tool calls. Jira Cloud compatibility can be added after the internal deployment path is stable.
