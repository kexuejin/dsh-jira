# Jira Work Board Sync Design

`dsh-jira` treats Jira as an external source of task facts and `dsh-work-board` as the local execution ledger. Operators configure Jira connection fields (`baseUrl`, `authMode`, `username`, credential reference, TLS settings) plus `workBoardSyncJql`, `workBoardSyncIntervalMs`, and `workBoardWriteback` on the `jira-issue-tracker` Cordis row.

The sync loop runs on the Host. Each tick searches Jira with `workBoardSyncJql`, maps each issue to a `jira:<issue-key>` Work Board task, and calls the Work Board manual sync service. Jira refreshes issue-derived fields such as title, status, priority, assignee, reporter, update time, and URL. Work Board keeps local execution history, scheduling, archive state, and execution target settings so agents can keep working even as issue metadata changes.

Agent collaboration starts from the Work Board card. The generated task prompt includes the Jira key, summary, and URL. The existing Work Board runner opens the agent execution and records the session and result in the local ledger.

Writeback is comment-based by default. When a Jira-backed task has a settled execution and `workBoardWriteback` is enabled, `dsh-jira` checks the issue comments for a `[dsh-work-board:<execution-id>]` marker and adds one result comment only if the marker is absent. Jira transitions remain explicit via the existing `jira_transition_issue` tool until workflow-specific transition mapping is configured.
