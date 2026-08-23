import type { Context } from '@deepseek-ai/cordis'
import type { JsonValue } from '@deepseek-ai/dsh-session/types'
import type {} from '@deepseek-ai/dsh-client-connection'
import { credentialRef } from '@deepseek-ai/dsh-credentials'
import { createJiraClient } from './jira.ts'
import { JiraConfigStore, sanitizeJiraConfigPatch } from './config-store.ts'
import {
  JIRA_RPC_CHANNEL,
  type JiraAddCommentArgs,
  type JiraGetIssueArgs,
  type JiraGetTransitionsArgs,
  type JiraSaveConfigArgs,
  type JiraSaveCredentialArgs,
  type JiraSearchArgs,
  type JiraTransitionIssueArgs,
} from './model.ts'

function asJson(value: unknown): JsonValue {
  return JSON.parse(JSON.stringify(value)) as JsonValue
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stringField(payload: unknown, field: string): string | undefined {
  if (!isRecord(payload)) return undefined
  const value = payload[field]
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined
}

function numberField(payload: unknown, field: string): number | undefined {
  if (!isRecord(payload)) return undefined
  const value = payload[field]
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function viewField(payload: unknown): JiraSearchArgs['view'] | undefined {
  const value = stringField(payload, 'view')
  return value === 'assigned' || value === 'watching' || value === 'reported' || value === 'custom' ? value : undefined
}

function searchArgs(payload: unknown): JiraSearchArgs {
  const jql = stringField(payload, 'jql')
  const view = viewField(payload)
  const startAt = numberField(payload, 'startAt')
  const maxResults = numberField(payload, 'maxResults')
  return {
    ...(jql === undefined ? {} : { jql }),
    ...(view === undefined ? {} : { view }),
    ...(startAt === undefined ? {} : { startAt }),
    ...(maxResults === undefined ? {} : { maxResults }),
  }
}

function getIssueArgs(payload: unknown): JiraGetIssueArgs {
  return { issueKey: stringField(payload, 'issueKey') ?? '' }
}

function getTransitionsArgs(payload: unknown): JiraGetTransitionsArgs {
  return { issueKey: stringField(payload, 'issueKey') ?? '' }
}

function addCommentArgs(payload: unknown): JiraAddCommentArgs {
  return { issueKey: stringField(payload, 'issueKey') ?? '', body: stringField(payload, 'body') ?? '' }
}

function transitionIssueArgs(payload: unknown): JiraTransitionIssueArgs {
  const transitionId = stringField(payload, 'transitionId')
  const transitionName = stringField(payload, 'transitionName')
  const comment = stringField(payload, 'comment')
  return {
    issueKey: stringField(payload, 'issueKey') ?? '',
    ...(transitionId === undefined ? {} : { transitionId }),
    ...(transitionName === undefined ? {} : { transitionName }),
    ...(comment === undefined ? {} : { comment }),
  }
}

function saveConfigArgs(payload: unknown): JiraSaveConfigArgs {
  const config = isRecord(payload) && isRecord(payload.config) ? payload.config : {}
  return { config: sanitizeJiraConfigPatch(config) }
}


function saveCredentialArgs(payload: unknown): JiraSaveCredentialArgs {
  return { credentialRef: stringField(payload, 'credentialRef') ?? '', value: stringField(payload, 'value') ?? '' }
}

async function saveCredential(ctx: Context, payload: JiraSaveCredentialArgs): Promise<{ readonly credentialRef: string; readonly message: string }> {
  const ref = credentialRef(payload.credentialRef)
  const value = payload.value.trim()
  if (value.length === 0) throw new Error('jira credential value is required')
  const credentials = ctx.get('credentials')
  if (credentials === undefined) throw new Error('credentials service is not mounted')
  await credentials.set(ref, value)
  return { credentialRef: ref, message: `Saved credential ${ref}.` }
}

function ok(value: unknown): { readonly ok: true; readonly value: JsonValue } {
  return { ok: true, value: asJson(value) }
}

function failure(error: unknown): { readonly ok: false; readonly error: { readonly code: 'command-error'; readonly message: string; readonly details: {} } } {
  return {
    ok: false,
    error: {
      code: 'command-error',
      message: error instanceof Error ? error.message : String(error),
      details: {},
    },
  }
}

export function registerJiraRpc(ctx: Context, store: JiraConfigStore): void {
  ctx.connection.rpc.handle(JIRA_RPC_CHANNEL, async (endpoint, payload) => {
    try {
      switch (endpoint) {
        case 'status':
          return ok(await createJiraClient(ctx, store.current()).status())
        case 'config':
          return ok(store.view())
        case 'saveConfig':
          return ok(store.save(saveConfigArgs(payload).config))
        case 'saveCredential':
          return ok(await saveCredential(ctx, saveCredentialArgs(payload)))
        case 'search':
          return ok(await createJiraClient(ctx, store.current()).search(searchArgs(payload)))
        case 'getIssue':
          return ok(await createJiraClient(ctx, store.current()).getIssue(getIssueArgs(payload)))
        case 'getTransitions':
          return ok(await createJiraClient(ctx, store.current()).listTransitions(getTransitionsArgs(payload)))
        case 'addComment':
          return ok(await createJiraClient(ctx, store.current()).addComment(addCommentArgs(payload)))
        case 'transitionIssue':
          return ok(await createJiraClient(ctx, store.current()).transitionIssue(transitionIssueArgs(payload)))
        default:
          return failure(new Error(`unknown jira endpoint: ${endpoint}`))
      }
    } catch (error) {
      return failure(error)
    }
  }, { authority: 'loopback' })
}
