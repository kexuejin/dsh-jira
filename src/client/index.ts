import type { Context as ClientContext } from '@deepseek-ai/cordis'
import type { ConnectionHandle, RpcResult } from '@deepseek-ai/dsh-client-connection/client'
import type {} from '@deepseek-ai/dsh-client-locale/client'
// Type-only: pulls the layout service's Context merge (ctx.layout).
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
// Type-only: pulls the slot registry's Context merge (ctx.slots).
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// Type-only: pulls the ui-sidebar SlotMap merge ('sidebar.panellist').
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import {
  JIRA_RPC_CHANNEL,
  type JiraRpcEndpoint,
  type JiraRpcResultMap,
  type JiraSaveConfigArgs,
  type JiraSaveCredentialArgs,
  type JiraSearchArgs,
  type JiraGetIssueArgs,
  type JiraGetTransitionsArgs,
  type JiraAddCommentArgs,
  type JiraTransitionIssueArgs,
} from '../model.ts'
import type { JiraPanelPort } from './JiraPanel.tsx'
import { JIRA_PANEL_ID, JiraMainPanel, JiraPanelIcon, type JiraPanelInjected } from './panel-entry.tsx'
import { en, NS, zh, type JiraTrackerKey } from './locales.ts'

export type { JiraTrackerKey } from './locales.ts'

/** Services required by the panel slots and the RPC port they serve. */
export const inject = ['slots', 'locale', 'layout', 'connection']

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
    config: () => call('config'),
    saveConfig: (args: JiraSaveConfigArgs) => call('saveConfig', args),
    saveCredential: (args: JiraSaveCredentialArgs) => call('saveCredential', args),
    search: (args: JiraSearchArgs) => call('search', args),
    getIssue: (args: JiraGetIssueArgs) => call('getIssue', args),
    getTransitions: (args: JiraGetTransitionsArgs) => call('getTransitions', args),
    addComment: (args: JiraAddCommentArgs) => call('addComment', args),
    transitionIssue: (args: JiraTransitionIssueArgs) => call('transitionIssue', args),
  }
}

/**
 * Contribute the Jira sidebar row and the main-column panel it selects.
 * @param ctx - the browser plugin context.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(NS, { zh, en }), 'jira-tracker: dictionaries')
  const port = createPort(ctx.get('connection') as ConnectionHandle)
  const t = ctx.locale.bind(NS)
  // Resolved inside the inject factories: a slot is claimed later than this
  // plugin applies, and the layout service is what the frame offers at that point.
  const panelFace = (): JiraPanelInjected => ({
    port,
    selectPanel: (id) => { ctx.layout.selectPanel(id) },
  })
  ctx.slots.inject('sidebar.panellist', () => ctx.slots.register({
    name: 'sidebar.panellist',
    id: JIRA_PANEL_ID,
    order: 30,
    locale: NS,
    label: () => t('panel.trigger' as JiraTrackerKey),
  }, JiraPanelIcon))
  ctx.slots.inject('main', () => ctx.slots.register({
    name: 'main',
    key: JIRA_PANEL_ID,
    locale: NS,
    inject: panelFace,
  }, JiraMainPanel))
}
