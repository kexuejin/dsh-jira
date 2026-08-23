import type { Context } from '@deepseek-ai/cordis'
import { createJiraClient, type Config as JiraConfig } from './jira.ts'
import type { JiraIssueSummary } from './model.ts'

export interface JiraWorkBoardSyncConfig extends JiraConfig {
  readonly workBoardSync?: boolean
  readonly workBoardSyncJql?: string
  readonly workBoardSyncIntervalMs?: number
  readonly workBoardWriteback?: boolean
  /** Jira transition name applied when a synced issue's work-board execution succeeds. */
  readonly workBoardDoneTransition?: string
  /** Jira transition name applied when a synced issue's work-board execution fails. */
  readonly workBoardFailedTransition?: string
}

type ConfigInput = JiraWorkBoardSyncConfig | (() => JiraWorkBoardSyncConfig)

function currentConfig(input: ConfigInput): JiraWorkBoardSyncConfig {
  return typeof input === 'function' ? input() : input
}

type TaskStatus = 'backlog' | 'todo' | 'running' | 'done' | 'failed'

type ExecutionResult = 'succeeded' | 'failed' | 'cancelled'

interface ExecutionRecordLike {
  readonly id: string
  readonly sessionId?: string
  readonly startedAt: number
  readonly endedAt?: number
  readonly result?: ExecutionResult
  readonly error?: string
}

interface TaskRecordLike {
  readonly id: string
  readonly title: string
  readonly description: string
  readonly prompt: string
  readonly status: TaskStatus
  readonly createdAt: number
  readonly updatedAt: number
  readonly executions: readonly ExecutionRecordLike[]
}

interface ManualSnapshotLike {
  readonly tasks: readonly TaskRecordLike[]
}

interface WorkBoardExternalTaskHandlerLike {
  transition(taskId: string, input: { transitionId?: string; transitionName?: string; comment?: string }): Promise<string>
}

interface WorkBoardManualSyncServiceLike {
  syncManualTasks(sourceId: string, tasks: readonly TaskRecordLike[]): ManualSnapshotLike
  manualSnapshot(): ManualSnapshotLike
  registerExternalTaskHandler(prefix: string, handler: WorkBoardExternalTaskHandlerLike): () => void
}

const SOURCE_ID = 'jira'
const DEFAULT_SYNC_INTERVAL_MS = 5 * 60 * 1000
const MIN_SYNC_INTERVAL_MS = 30 * 1000
const DEFAULT_SYNC_JQL = 'assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC'
const WRITEBACK_MARKER_PREFIX = '[dsh-work-board:'

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed
}

function syncJql(config: JiraWorkBoardSyncConfig): string {
  return clean(config.workBoardSyncJql) ?? clean(config.assignedJql) ?? DEFAULT_SYNC_JQL
}

function syncIntervalMs(config: JiraWorkBoardSyncConfig): number {
  const value = config.workBoardSyncIntervalMs ?? DEFAULT_SYNC_INTERVAL_MS
  return Math.max(value, MIN_SYNC_INTERVAL_MS)
}

function timestamp(value: string | undefined, fallback: number): number {
  const parsed = value === undefined ? NaN : Date.parse(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function statusFor(issue: JiraIssueSummary): TaskStatus {
  const source = `${issue.status} ${issue.statusCategory ?? ''}`.toLowerCase()
  if (source.includes('done') || source.includes('resolved') || source.includes('closed')) return 'done'
  if (source.includes('progress') || source.includes('review') || source.includes('indeterminate')) return 'running'
  return 'todo'
}

function issueDescription(issue: JiraIssueSummary): string {
  return [
    `Jira: ${issue.key}`,
    `Status: ${issue.status}`,
    issue.priority === undefined ? undefined : `Priority: ${issue.priority}`,
    issue.issueType === undefined ? undefined : `Type: ${issue.issueType}`,
    issue.assignee === undefined ? undefined : `Assignee: ${issue.assignee}`,
    issue.reporter === undefined ? undefined : `Reporter: ${issue.reporter}`,
    issue.updated === undefined ? undefined : `Updated: ${issue.updated}`,
    `URL: ${issue.url}`,
  ].filter((line): line is string => line !== undefined).join('\n')
}

function issuePrompt(issue: JiraIssueSummary): string {
  return [
    `Work on Jira issue ${issue.key}: ${issue.summary}.`,
    `Jira URL: ${issue.url}`,
    'First inspect the issue details and comments if needed, then make progress and summarize the result for Jira writeback.',
  ].join('\n')
}

function taskFromIssue(issue: JiraIssueSummary, now: number): TaskRecordLike {
  const createdAt = timestamp(issue.created, now)
  const updatedAt = timestamp(issue.updated, createdAt)
  return {
    id: `jira:${issue.key}`,
    title: `[${issue.key}] ${issue.summary}`,
    description: issueDescription(issue),
    prompt: issuePrompt(issue),
    status: statusFor(issue),
    createdAt,
    updatedAt,
    executions: [],
  }
}

function issueKeyFromTaskId(id: string): string | undefined {
  const match = /^jira:([A-Z][A-Z0-9]+-\d+)$/u.exec(id)
  return match?.[1]
}

function latestSettledExecution(task: TaskRecordLike): ExecutionRecordLike | undefined {
  return [...task.executions]
    .filter(execution => execution.endedAt !== undefined && execution.result !== undefined)
    .sort((a, b) => (b.endedAt ?? b.startedAt) - (a.endedAt ?? a.startedAt))[0]
}

function writebackMarker(executionId: string): string {
  return `${WRITEBACK_MARKER_PREFIX}${executionId}]`
}

function writebackBody(task: TaskRecordLike, execution: ExecutionRecordLike): string {
  const outcome = execution.result ?? 'unknown'
  return [
    `${writebackMarker(execution.id)} DSH work-board agent execution ${outcome}.`,
    execution.sessionId === undefined ? undefined : `Session: ${execution.sessionId}`,
    execution.error === undefined ? undefined : `Error: ${execution.error}`,
  ].filter((line): line is string => line !== undefined).join('\n')
}

function workBoard(ctx: Context): WorkBoardManualSyncServiceLike | undefined {
  const service = ctx.get('workBoard') as Partial<WorkBoardManualSyncServiceLike> | undefined
  return typeof service?.syncManualTasks === 'function' && typeof service.manualSnapshot === 'function'
    ? service as WorkBoardManualSyncServiceLike
    : undefined
}

async function syncIssues(ctx: Context, input: ConfigInput): Promise<void> {
  const config = currentConfig(input)
  if (config.workBoardSync === false || clean(config.baseUrl) === undefined) return
  const board = workBoard(ctx)
  if (board === undefined) return
  const client = createJiraClient(ctx, config)
  const now = Date.now()
  const result = await client.search({
    view: 'custom',
    jql: syncJql(config),
    ...(config.maxResults === undefined ? {} : { maxResults: config.maxResults }),
  })
  board.syncManualTasks(SOURCE_ID, result.issues.map(issue => taskFromIssue(issue, now)))
}

function transitionMarker(executionId: string): string {
  return `${WRITEBACK_MARKER_PREFIX}${executionId}:transition]`
}

async function writeBackSettledExecutions(ctx: Context, input: ConfigInput, seen: Set<string>): Promise<void> {
  const config = currentConfig(input)
  if (config.workBoardWriteback === false || clean(config.baseUrl) === undefined) return
  const board = workBoard(ctx)
  if (board === undefined) return
  const client = createJiraClient(ctx, config)
  for (const task of board.manualSnapshot().tasks) {
    const issueKey = issueKeyFromTaskId(task.id)
    if (issueKey === undefined) continue
    const execution = latestSettledExecution(task)
    if (execution === undefined) continue
    const marker = writebackMarker(execution.id)
    if (seen.has(marker)) continue
    const transitionName = execution.result === 'failed'
      ? clean(config.workBoardFailedTransition)
      : execution.result === 'succeeded' ? clean(config.workBoardDoneTransition) : undefined
    try {
      const detail = await client.getIssue({ issueKey })
      if (detail.comments.some(comment => comment.body.includes(marker))) {
        seen.add(marker)
        continue
      }
      await client.addComment({ issueKey, body: writebackBody(task, execution) })
      seen.add(marker)
      const transitionMarkerValue = transitionMarker(execution.id)
      if (transitionName !== undefined && !detail.comments.some(comment => comment.body.includes(transitionMarkerValue))) {
        try {
          await client.transitionIssue({ issueKey, transitionName, comment: writebackBody(task, execution) })
        } catch (error) {
          console.error('[dsh-jira] work-board transition failed', error)
        }
      }
    } catch (error) {
      console.error('[dsh-jira] work-board writeback failed', error)
    }
  }
}

export function registerJiraWorkBoardSync(ctx: Context, input: ConfigInput): void {
  const board = workBoard(ctx)
  if (board?.registerExternalTaskHandler !== undefined) {
    ctx.effect(
      () => board.registerExternalTaskHandler('jira:', {
        async transition(taskId: string, transitionInput: { transitionId?: string; transitionName?: string; comment?: string }) {
          const issueKey = issueKeyFromTaskId(taskId)
          if (issueKey === undefined) throw new Error(`task ${taskId} is not a Jira issue`)
          const client = createJiraClient(ctx, currentConfig(input))
          return (await client.transitionIssue({
            issueKey,
            ...(transitionInput.transitionId === undefined ? {} : { transitionId: transitionInput.transitionId }),
            ...(transitionInput.transitionName === undefined ? {} : { transitionName: transitionInput.transitionName }),
            ...(transitionInput.comment === undefined ? {} : { comment: transitionInput.comment }),
          })).message
        },
      }),
      'jira: work-board external transition handler',
    )
  }
  const seenWritebacks = new Set<string>()
  let syncInFlight = false
  let writebackInFlight = false
  const runSync = (): void => {
    if (syncInFlight) return
    syncInFlight = true
    void syncIssues(ctx, input).catch(error => {
      console.error('[dsh-jira] work-board sync failed', error)
    }).finally(() => { syncInFlight = false })
  }
  const runWriteback = (): void => {
    if (writebackInFlight) return
    writebackInFlight = true
    void writeBackSettledExecutions(ctx, input, seenWritebacks).catch(error => {
      console.error('[dsh-jira] work-board writeback failed', error)
    }).finally(() => { writebackInFlight = false })
  }
  const interval = setInterval(() => {
    runSync()
    runWriteback()
  }, syncIntervalMs(currentConfig(input)))
  runSync()
  runWriteback()
  ctx.effect(() => () => { clearInterval(interval) }, 'jira: work-board sync loop')
}
