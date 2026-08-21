import type { Context } from '@deepseek-ai/cordis'
import { createJiraClient, type Config } from './jira.ts'

/**
 * Minimal structural face of the work-board service so `dsh-jira` can register
 * a provider without a hard dependency on `dsh-work-board`. When the board is
 * not mounted this module is a no-op.
 */
export interface WorkBoardServiceLike {
  register(provider: WorkSourceProviderLike): () => void
}

export interface WorkSourceQueryLike {
  readonly filterId?: string
}

export interface WorkItemLike {
  readonly id: string
  readonly sourceId: string
  readonly externalId: string
  readonly title: string
  readonly summary?: string
  readonly status: 'todo' | 'running' | 'done'
  readonly priority?: string
  readonly updatedAt?: string
  readonly url?: string
}

export interface WorkItemDetailLike extends WorkItemLike {
  readonly description?: string
  readonly prompt?: string
}

export interface WorkActionLike {
  readonly id: string
  readonly label: string
  readonly prompt?: string
}

export interface WorkSourceProviderLike {
  readonly id: string
  readonly title: string
  readonly filters?: readonly { readonly id: string; readonly label: string }[]
  list(query: WorkSourceQueryLike): Promise<readonly WorkItemLike[]>
  get(id: string): Promise<WorkItemDetailLike | undefined>
  actions(item: WorkItemDetailLike): Promise<readonly WorkActionLike[]>
}

function statusFor(jiraStatus: string): WorkItemLike['status'] {
  const lower = jiraStatus.toLowerCase()
  if (lower.includes('progress') || lower.includes('review')) return 'running'
  if (lower.includes('done') || lower.includes('resolved') || lower.includes('closed')) return 'done'
  return 'todo'
}

/**
 * A work-board source provider backed by the Jira client: unresolved issues
 * assigned to the current user, plus start/open actions. Providers never
 * expose credentials; baseUrl/token resolution stays inside the Jira client.
 */
export function createJiraWorkSource(ctx: Context, config: Config): WorkSourceProviderLike {
  const client = createJiraClient(ctx, config)
  return {
    id: 'jira',
    title: 'Jira',
    filters: [{ id: 'mine', label: 'My unresolved' }],
    async list(query: WorkSourceQueryLike): Promise<readonly WorkItemLike[]> {
      const result = await client.search(query.filterId === 'mine' ? { view: 'assigned', jql: 'assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC' } : { view: 'assigned' })
      return result.issues.map(issue => ({
        id: `jira:${issue.key}`,
        sourceId: 'jira',
        externalId: issue.key,
        title: issue.summary,
        status: statusFor(issue.status),
        ...(issue.priority === undefined ? {} : { priority: issue.priority }),
        ...(issue.updated === undefined ? {} : { updatedAt: issue.updated }),
        ...(issue.url === undefined ? {} : { url: issue.url }),
      }))
    },
    async get(id: string): Promise<WorkItemDetailLike | undefined> {
      const match = /^jira:([A-Z][A-Z0-9]+-\d+)$/u.exec(id)
      if (match === null) return undefined
      const detail = await client.getIssue({ issueKey: match[1] })
      return {
        id,
        sourceId: 'jira',
        externalId: detail.key,
        title: detail.summary,
        status: statusFor(detail.status),
        ...(detail.priority === undefined ? {} : { priority: detail.priority }),
        ...(detail.updated === undefined ? {} : { updatedAt: detail.updated }),
        ...(detail.url === undefined ? {} : { url: detail.url }),
        ...(detail.description === undefined ? {} : { description: detail.description }),
        prompt: `Work on Jira issue ${detail.key}: ${detail.summary}.`,
      }
    },
    async actions(item: WorkItemDetailLike): Promise<readonly WorkActionLike[]> {
      return [
        { id: 'start', label: 'Start work', prompt: item.prompt ?? `Work on Jira ${item.externalId}.` },
        ...(item.url === undefined ? [] : [{ id: 'open', label: 'Open in Jira', prompt: `Open ${item.url}` }]),
      ]
    },
  }
}

/** Register the Jira source when a work-board service is present. */
export function registerJiraWorkSource(ctx: Context, config: Config): void {
  const workBoard = ctx.get('workBoard') as WorkBoardServiceLike | undefined
  if (workBoard === undefined) return
  const dispose = workBoard.register(createJiraWorkSource(ctx, config))
  ctx.effect(() => dispose, 'jira: work-board source')
}
