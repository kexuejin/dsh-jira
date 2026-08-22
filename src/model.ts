export const JIRA_RPC_CHANNEL = '/jira'

export type JiraAuthMode = 'pat' | 'basic'
export type JiraConnectionStatus = 'configured' | 'missing-config' | 'missing-credential' | 'error'

export interface JiraConnectionConfigView {
  readonly baseUrl?: string
  readonly authMode: JiraAuthMode
  readonly credentialRef: string
  readonly username?: string
  readonly strictTls: boolean
  readonly caCertificatePath?: string
  readonly proxyUrl?: string
  readonly timeoutMs: number
  readonly maxResults: number
}

export interface JiraConnectionStatusView {
  readonly status: JiraConnectionStatus
  readonly config: JiraConnectionConfigView
  readonly credentialConfigured: boolean
  readonly message: string
  readonly user?: JiraUser
}

export interface JiraUser {
  readonly key?: string
  readonly name?: string
  readonly displayName?: string
  readonly emailAddress?: string
  readonly active?: boolean
}

export interface JiraIssueSummary {
  readonly key: string
  readonly id?: string
  readonly summary: string
  readonly status: string
  readonly statusCategory?: string
  readonly issueType?: string
  readonly priority?: string
  readonly assignee?: string
  readonly reporter?: string
  readonly updated?: string
  readonly created?: string
  readonly url: string
}

export interface JiraComment {
  readonly id: string
  readonly author?: string
  readonly created?: string
  readonly updated?: string
  readonly body: string
}

export interface JiraTransition {
  readonly id: string
  readonly name: string
  readonly to?: string
}

export interface JiraIssueDetail extends JiraIssueSummary {
  readonly description?: string
  readonly comments: readonly JiraComment[]
  readonly transitions: readonly JiraTransition[]
}

export interface JiraSearchArgs {
  readonly jql?: string
  readonly view?: JiraIssueView
  readonly startAt?: number
  readonly maxResults?: number
}

export type JiraIssueView = 'assigned' | 'watching' | 'reported' | 'custom'

export interface JiraSearchResult {
  readonly jql: string
  readonly startAt: number
  readonly maxResults: number
  readonly total?: number
  readonly issues: readonly JiraIssueSummary[]
}

export interface JiraGetIssueArgs {
  readonly issueKey: string
}

export interface JiraGetTransitionsArgs {
  readonly issueKey: string
}

export interface JiraAddCommentArgs {
  readonly issueKey: string
  readonly body: string
}

export interface JiraTransitionIssueArgs {
  readonly issueKey: string
  readonly transitionId?: string
  readonly transitionName?: string
  readonly comment?: string
}

export interface JiraMutationResult {
  readonly issueKey: string
  readonly status: string
  readonly message: string
}

export type JiraRpcEndpoint = 'status' | 'search' | 'getIssue' | 'getTransitions' | 'addComment' | 'transitionIssue'

export interface JiraRpcResultMap {
  readonly status: JiraConnectionStatusView
  readonly search: JiraSearchResult
  readonly getIssue: JiraIssueDetail
  readonly getTransitions: readonly JiraTransition[]
  readonly addComment: JiraMutationResult
  readonly transitionIssue: JiraMutationResult
}
