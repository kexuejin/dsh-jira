import type { ClientContext } from '@deepseek-ai/dsh-client-runtime/client'
import type { ConnectionHandle, RpcResult } from '@deepseek-ai/dsh-client-connection/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import {
  JIRA_RPC_CHANNEL,
  type JiraRpcEndpoint,
  type JiraRpcResultMap,
  type JiraSearchArgs,
  type JiraGetIssueArgs,
  type JiraAddCommentArgs,
  type JiraTransitionIssueArgs,
} from '../model.ts'
import type { JiraPanelPort } from './JiraPanel.tsx'
import { createJiraController } from './panel-mount.tsx'
import { mountSidebarEntry } from './sidebar-entry.ts'
import { en, NS, zh } from './locales.ts'

export type { JiraTrackerKey } from './locales.ts'

export const inject = ['locale', 'connection']

function unwrapResult<Endpoint extends JiraRpcEndpoint>(
  endpoint: Endpoint,
  result: RpcResult<unknown>,
): JiraRpcResultMap[Endpoint] {
  if (result.ok) return result.value as JiraRpcResultMap[Endpoint]
  throw new Error(`${endpoint}: ${result.error.code}: ${result.error.message}`)
}

function createPort(connection: ConnectionHandle): JiraPanelPort {
  const call = async <Endpoint extends JiraRpcEndpoint>(
    endpoint: Endpoint,
    payload: unknown = {},
  ): Promise<JiraRpcResultMap[Endpoint]> => {
    const result = await connection.rpc.call(JIRA_RPC_CHANNEL, endpoint, payload)
    return unwrapResult(endpoint, result)
  }
  return {
    status: () => call('status'),
    search: (args: JiraSearchArgs) => call('search', args),
    getIssue: (args: JiraGetIssueArgs) => call('getIssue', args),
    addComment: (args: JiraAddCommentArgs) => call('addComment', args),
    transitionIssue: (args: JiraTransitionIssueArgs) => call('transitionIssue', args),
  }
}

export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'jira-tracker: dictionaries')
  const port = createPort(ctx.get('connection') as ConnectionHandle)
  const t = ctx.locale.bind(NS)
  const controller = createJiraController(port, t)
  const disposeEntry = mountSidebarEntry(controller, t)
  ctx.effect(() => () => {
    disposeEntry()
    controller.dispose()
  }, 'jira-tracker: sidebar entry and panel')
}
