# Work Board Project Mapping

## Goal

`dsh-jira` keeps Jira-specific configuration and sync policy while `dsh-work-board` remains the generic board. Jira project mappings connect synced issues to the local DSH workspace where an agent can analyze and execute the work.

## Install modes

The Jira plugin has two supported modes:

- Standalone: only `dsh-jira` is installed. The Jira panel and `jira_*` tools work, while Work Board sync/writeback stay inactive.
- Connected: both `dsh-jira` and `dsh-work-board` are installed. The Jira panel reports the Work Board integration as connected, and synced Jira issues become Work Board tasks.

## Configuration

The runtime config field `workBoardProjectMappings` is a JSON array in the Jira panel and in `~/.dsh/jira/config-v1.json`:

```json
[
  {
    "projectKey": "APP",
    "workspaceId": "/Volumes/Kapp/source/app",
    "mode": "default",
    "permission": "workspace-write"
  }
]
```

`projectKey` matches the uppercase prefix in Jira issue keys such as `APP-123`. `workspaceId`, `mode`, and `permission` are copied into new synced Work Board tasks so execution starts from the right project context. Existing Work Board task overrides stay local and are not overwritten by later syncs.

## Analysis flow

Work Board owns the `Analyze Issue` card action. `dsh-jira` supplies the synced issue context and project mapping; Work Board creates a follow-on analysis task that inherits the mapped execution target. The agent then analyzes the issue against the local project and produces a plan before implementation.
