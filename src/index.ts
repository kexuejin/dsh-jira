import type { Context } from '@deepseek-ai/cordis'
import z from '@deepseek-ai/schemastery'
import { defineTool } from '@deepseek-ai/dsh-tools'
import type { JsonValue } from '@deepseek-ai/dsh-session/types'
import { createJiraClient } from './jira.ts'
import { registerJiraRpc } from './rpc.ts'
import { registerJiraWorkSource } from './work-source.ts'
import { registerJiraWorkBoardSync, type JiraWorkBoardSyncConfig } from './work-board-sync.ts'
import type { JiraAddCommentArgs, JiraGetIssueArgs, JiraSearchArgs, JiraTransitionIssueArgs } from './model.ts'

export type * from './model.ts'
export { createJiraClient, internals, resolveConfig } from './jira.ts'
export { createJiraWorkSource, registerJiraWorkSource } from './work-source.ts'
export { JIRA_RPC_CHANNEL } from './model.ts'
export { registerJiraRpc } from './rpc.ts'

export const name = 'jira-issue-tracker'
export const inject = ['tools', 'connection']

export interface Config extends JiraWorkBoardSyncConfig {}

export const Config: z<Config> = z.object({
  baseUrl: z.string(),
  authMode: z.union(['pat', 'basic']).default('pat'),
  tokenCredentialRef: z.string().role('credential-ref').default('JIRA_API_TOKEN'),
  username: z.string(),
  strictTls: z.boolean().default(true),
  caCertificatePath: z.string(),
  proxyUrl: z.string(),
  timeoutMs: z.number().step(1).min(1000).default(15000),
  maxResults: z.number().step(1).min(1).max(100).default(25),
  assignedJql: z.string(),
  watchingJql: z.string(),
  reportedJql: z.string(),
  workBoardSync: z.boolean().default(true),
  workBoardSyncJql: z.string(),
  workBoardSyncIntervalMs: z.number().step(1).min(30000).default(300000),
  workBoardWriteback: z.boolean().default(true),
  workBoardDoneTransition: z.string(),
  workBoardFailedTransition: z.string(),
  workBoardManualTransitions: z.array(z.string()).default([]),
})

const JSON_OUTPUT = { schema: { type: 'json' } } as const

const SEARCH_ARGS = {
  jql: { type: 'string', description: 'Optional explicit JQL. Required when view is custom.' },
  view: { type: 'string', description: 'One of assigned, watching, reported, or custom. Defaults to assigned.' },
  startAt: { type: 'number', description: 'Zero-based page start.' },
  maxResults: { type: 'number', description: 'Maximum issues to return, capped by plugin config.' },
} as const

const ISSUE_KEY_ARG = {
  issueKey: { type: 'string', description: 'Jira issue key, for example PROJ-123.' },
} as const

function asJson(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue
}

function textResult(text: string): [{ type: 'text'; text: string }] {
  return [{ type: 'text', text }]
}

function jsonObject(value: JsonValue | undefined): { readonly [key: string]: JsonValue } | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value : undefined
}

function jsonString(value: JsonValue | undefined, fallback: string): string {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : fallback
}

export function apply(ctx: Context, config: Config = {}): void {
  registerJiraRpc(ctx, config)
  registerJiraWorkSource(ctx, config)
  registerJiraWorkBoardSync(ctx, config)

  ctx.tools.register(defineTool({
    name: 'jira_search_issues',
    description: [
      'Search the configured internal Jira instance with JQL or a personal view.',
      'Read-only; returns capped issue summaries and never exposes credentials.',
    ].join(' '),
    parameters: SEARCH_ARGS,
    output: {
      ...JSON_OUTPUT,
      render: (_args, value) => {
        const object = jsonObject(value)
        const issues = object?.issues
        const count = Array.isArray(issues) ? issues.length : 0
        return textResult(`Jira search returned ${String(count)} issue(s).`)
      },
    },
    async execute(args: JiraSearchArgs) {
      return asJson(await createJiraClient(ctx, config).search(args))
    },
    presentCall: args => ({ card: 'generic', title: 'Search Jira issues', kind: 'other', rawInput: args }),
  }))

  ctx.tools.register(defineTool({
    name: 'jira_get_issue',
    description: 'Read one Jira issue with selected fields, recent comments, and available transitions. Read-only.',
    parameters: ISSUE_KEY_ARG,
    output: {
      ...JSON_OUTPUT,
      render: (_args, value) => {
        const object = jsonObject(value)
        return textResult(`Jira issue ${jsonString(object?.key, 'unknown')} — ${jsonString(object?.summary, 'no summary')}`)
      },
    },
    async execute(args: JiraGetIssueArgs) {
      return asJson(await createJiraClient(ctx, config).getIssue(args))
    },
    presentCall: args => ({ card: 'generic', title: 'Get Jira issue', kind: 'other', rawInput: args }),
  }))

  ctx.tools.register(defineTool({
    name: 'jira_add_comment',
    description: 'Add a comment to one Jira issue. Requires an explicit issue key and comment body; never performs bulk writes.',
    parameters: {
      ...ISSUE_KEY_ARG,
      body: { type: 'string', description: 'Plain-text Jira comment body.' },
    },
    output: {
      ...JSON_OUTPUT,
      render: (_args, value) => {
        const object = jsonObject(value)
        return textResult(jsonString(object?.message, 'Jira comment request completed.'))
      },
    },
    async execute(args: JiraAddCommentArgs) {
      return asJson(await createJiraClient(ctx, config).addComment(args))
    },
    presentCall: args => ({ card: 'generic', title: 'Comment on Jira issue', kind: 'other', rawInput: args }),
  }))

  ctx.tools.register(defineTool({
    name: 'jira_transition_issue',
    description: [
      'Transition one Jira issue using an explicit transition id or exact transition name.',
      'Call jira_get_issue first to inspect available transitions.',
    ].join(' '),
    parameters: {
      ...ISSUE_KEY_ARG,
      transitionId: { type: 'string', description: 'Transition id from jira_get_issue.' },
      transitionName: { type: 'string', description: 'Exact transition name from jira_get_issue.' },
      comment: { type: 'string', description: 'Optional transition comment.' },
    },
    output: {
      ...JSON_OUTPUT,
      render: (_args, value) => {
        const object = jsonObject(value)
        return textResult(jsonString(object?.message, 'Jira transition request completed.'))
      },
    },
    async execute(args: JiraTransitionIssueArgs) {
      return asJson(await createJiraClient(ctx, config).transitionIssue(args))
    },
    presentCall: args => ({ card: 'generic', title: 'Transition Jira issue', kind: 'other', rawInput: args }),
  }))
}
