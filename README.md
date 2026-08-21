# dsh-jira

DSH external plugin for internal Jira issue tracking.

## Scope

- Track issues from a Jira Data Center or Jira Server deployment reachable from the DSH host.
- Show a first-level Jira entry in the DSH Web sidebar.
- Provide personal issue views for assigned, watching, reported, and custom JQL.
- Register agent tools for issue search, issue detail, comments, and single-issue transitions.
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
```

Set `JIRA_API_TOKEN` through the DSH credentials provider or the launching environment. For older internal deployments that require HTTP Basic authentication, set `authMode: basic`, `username`, and store the password or token in the same credential reference.

## Agent tools

- `jira_search_issues` searches with a personal view or explicit JQL.
- `jira_get_issue` reads selected fields, recent comments, and available transitions.
- `jira_add_comment` adds one plain-text comment to one explicit issue key.
- `jira_transition_issue` transitions one explicit issue by transition id or exact transition name.

## Safety boundary

Credential-bearing Jira HTTP requests reject redirects instead of following them. The plugin does not create issues, edit fields, upload attachments, run bulk updates, administer Jira projects, mirror Jira into local storage, or expose Jira raw JSON to the model.

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
