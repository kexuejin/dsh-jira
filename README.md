# dsh-jira

DSH external plugin for internal Jira issue tracking.

## Scope

- Track issues from a Jira Data Center or Jira Server deployment reachable from the DSH host.
- Show a first-level Jira entry in the DSH Web sidebar.
- Provide personal issue views for assigned, watching, reported, and custom JQL.
- Register agent tools for issue search, issue detail, comments, and single-issue transitions.
- Sync matching Jira issues into `dsh-work-board` when the Work Board plugin is mounted.
- Add one Jira comment when a Work Board agent execution settles, unless writeback is disabled.
- Keep Jira credentials on the Host side and return only redacted connection diagnostics to the Web UI or model.

## Configuration

Mount the plugin as a DSH profile bundle, then configure the `jira-issue-tracker` row:

```yaml
- id: jira-issue-tracker
  config:
    baseUrl: 'https://jira.internal.example'
    authMode: pat
    tokenCredentialRef: JIRA_API_TOKEN
    strictTls: true
    maxResults: 25
    workBoardSync: true
    workBoardSyncJql: 'assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC'
    workBoardSyncIntervalMs: 300000
    workBoardWriteback: true
```

Set `JIRA_API_TOKEN` through the DSH credentials provider or the launching environment. For older internal deployments that require HTTP Basic authentication, set `authMode: basic`, `username`, and store the password or token in the same credential reference.

## Work Board integration

When `dsh-work-board` is mounted, Jira issues matching `workBoardSyncJql` are synced into the Work Board manual task ledger as `jira:<issue-key>` tasks. The task prompt includes the Jira URL and issue summary so an agent can start from the board card. Local execution history stays in Work Board while issue title, status, priority, assignee, reporter, and URL refresh from Jira on each sync.

`workBoardWriteback` adds one Jira comment per completed Work Board execution using a `[dsh-work-board:<execution-id>]` marker, so retries do not duplicate comments across restarts. Set it to `false` for read-only synchronization. When `workBoardDoneTransition` or `workBoardFailedTransition` is set, the issue is also transitioned by exact transition name after a successful or failed execution, again guarded by a marker.

- `workBoardDoneTransition` / `workBoardFailedTransition`: exact transition name applied after a successful or failed execution (marker-guarded against retries).
- `workBoardManualTransitions`: Jira transition names offered as a manual action on the board card.

## Agent collaboration

Work Board cards for Jira issues expose the issue's current transitions as
one-click buttons plus a free-text transition name, all routed through the
Jira transition API — status moves stay inside the board. Agent executions
started from the card record their session and outcome in Work Board;
`workBoardWriteback` then reports the result back to Jira as a comment and
optionally a transition. Jira status changes also flow back into the board
column on the next sync.

## Agent tools

- `jira_search_issues` searches with a personal view or explicit JQL.
- `jira_get_issue` reads selected fields, recent comments, and available transitions.
- `jira_add_comment` adds one plain-text comment to one explicit issue key.
- `jira_transition_issue` transitions one explicit issue by transition id or exact transition name.

## Safety boundary

Credential-bearing Jira HTTP requests reject redirects instead of following them. The plugin does not create issues, edit fields, upload attachments, run bulk updates, administer Jira projects, or expose Jira raw JSON to the model. Work Board synchronization stores normalized issue task records and execution history locally so agents can collaborate from the board without exposing credentials to the browser.

`proxyUrl` is reserved for a later internal-network transport implementation. If it is set in this version, Jira operations fail closed with a diagnostic.

## Development

```bash
npm install
npm run check
```

Build outputs:

- Host bundle: `lib/index.js`
- Browser client bundle: `client/client.js`
- DSH composition patch: `cordis.patch.yml`
