import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type {
  JiraAddCommentArgs,
  JiraConfigEditorView,
  JiraConnectionStatusView,
  JiraEditableConfigView,
  JiraGetIssueArgs,
  JiraGetTransitionsArgs,
  JiraIssueDetail,
  JiraIssueSummary,
  JiraIssueView,
  JiraMutationResult,
  JiraSaveConfigArgs,
  JiraSaveCredentialArgs,
  JiraSearchArgs,
  JiraWorkBoardProjectMappingView,
  JiraSearchResult,
  JiraTransition,
  JiraTransitionIssueArgs,
} from '../model.ts'
import css from './JiraPanel.module.css'
import type { JiraTrackerKey } from './locales.ts'

export interface JiraPanelPort {
  status: () => Promise<JiraConnectionStatusView>
  config: () => Promise<JiraConfigEditorView>
  saveConfig: (args: JiraSaveConfigArgs) => Promise<JiraConfigEditorView>
  saveCredential: (args: JiraSaveCredentialArgs) => Promise<{ readonly credentialRef: string; readonly message: string }>
  search: (args: JiraSearchArgs) => Promise<JiraSearchResult>
  getIssue: (args: JiraGetIssueArgs) => Promise<JiraIssueDetail>
  getTransitions: (args: JiraGetTransitionsArgs) => Promise<readonly JiraTransition[]>
  addComment: (args: JiraAddCommentArgs) => Promise<JiraMutationResult>
  transitionIssue: (args: JiraTransitionIssueArgs) => Promise<JiraMutationResult>
}

export interface JiraPanelProps {
  readonly open: boolean
  readonly onClose: () => void
  readonly port: JiraPanelPort
  readonly t: TranslateNS<'jiraTracker'>
}

type BusyAction = 'status' | 'config' | 'search' | 'issue' | 'comment' | 'transition' | undefined

type ConfigDraft = Required<Pick<JiraEditableConfigView, 'authMode' | 'strictTls' | 'timeoutMs' | 'maxResults' | 'workBoardSync' | 'workBoardSyncIntervalMs' | 'workBoardWriteback'>> & {
  readonly baseUrl: string
  readonly tokenCredentialRef: string
  readonly username: string
  readonly assignedJql: string
  readonly watchingJql: string
  readonly reportedJql: string
  readonly workBoardSyncJql: string
  readonly workBoardDoneTransition: string
  readonly workBoardFailedTransition: string
  readonly workBoardManualTransitions: string
  readonly workBoardProjectMappings: string
}

function viewLabel(view: JiraIssueView, t: TranslateNS<'jiraTracker'>): string {
  switch (view) {
    case 'assigned': return t('panel.assigned' as JiraTrackerKey)
    case 'watching': return t('panel.watching' as JiraTrackerKey)
    case 'reported': return t('panel.reported' as JiraTrackerKey)
    case 'custom': return t('panel.custom' as JiraTrackerKey)
  }
}

function statusLabel(status: JiraConnectionStatusView['status'], t: TranslateNS<'jiraTracker'>): string {
  switch (status) {
    case 'configured': return t('panel.configured' as JiraTrackerKey)
    case 'missing-config': return t('panel.configMissing' as JiraTrackerKey)
    case 'missing-credential': return t('panel.credentialMissing' as JiraTrackerKey)
    case 'error': return t('panel.error' as JiraTrackerKey)
  }
}

function selectedIssue(issues: readonly JiraIssueSummary[], selectedKey: string | undefined): JiraIssueSummary | undefined {
  if (selectedKey !== undefined) return issues.find(issue => issue.key === selectedKey) ?? issues[0]
  return issues[0]
}

function dateLabel(value: string | undefined): string {
  if (value === undefined) return '—'
  try {
    return new Date(value).toLocaleString()
  } catch {
    return value
  }
}

function draftFromConfig(config: JiraEditableConfigView): ConfigDraft {
  return {
    baseUrl: config.baseUrl ?? '',
    authMode: config.authMode ?? 'pat',
    tokenCredentialRef: config.tokenCredentialRef ?? 'JIRA_API_TOKEN',
    username: config.username ?? '',
    strictTls: config.strictTls ?? true,
    timeoutMs: config.timeoutMs ?? 15000,
    maxResults: config.maxResults ?? 25,
    assignedJql: config.assignedJql ?? 'assignee = currentUser() ORDER BY updated DESC',
    watchingJql: config.watchingJql ?? 'watcher = currentUser() ORDER BY updated DESC',
    reportedJql: config.reportedJql ?? 'reporter = currentUser() ORDER BY updated DESC',
    workBoardSync: config.workBoardSync ?? true,
    workBoardSyncJql: config.workBoardSyncJql ?? 'assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC',
    workBoardSyncIntervalMs: config.workBoardSyncIntervalMs ?? 300000,
    workBoardWriteback: config.workBoardWriteback ?? true,
    workBoardDoneTransition: config.workBoardDoneTransition ?? '',
    workBoardFailedTransition: config.workBoardFailedTransition ?? '',
    workBoardManualTransitions: (config.workBoardManualTransitions ?? []).join(', '),
    workBoardProjectMappings: JSON.stringify(config.workBoardProjectMappings ?? [], null, 2),
  }
}

function text(value: string): string | undefined {
  const trimmed = value.trim()
  return trimmed.length === 0 ? undefined : trimmed
}

function projectMappingsFromDraft(value: string): JiraWorkBoardProjectMappingView[] {
  const trimmed = value.trim()
  if (trimmed.length === 0) return []
  const parsed = JSON.parse(trimmed) as unknown
  if (!Array.isArray(parsed)) throw new Error('Project mappings must be a JSON array.')
  return parsed.flatMap(item => {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) return []
    const row = item as Record<string, unknown>
    const projectKey = typeof row.projectKey === 'string' ? row.projectKey.trim().toUpperCase() : ''
    if (projectKey.length === 0) return []
    const workspaceId = typeof row.workspaceId === 'string' && row.workspaceId.trim().length > 0 ? row.workspaceId.trim() : undefined
    const mode = typeof row.mode === 'string' && row.mode.trim().length > 0 ? row.mode.trim() : undefined
    const permission = row.permission === 'read-only' || row.permission === 'workspace-write' || row.permission === 'danger-full-access' ? row.permission : undefined
    return [{
      projectKey,
      ...(workspaceId === undefined ? {} : { workspaceId }),
      ...(mode === undefined ? {} : { mode }),
      ...(permission === undefined ? {} : { permission }),
    }]
  })
}

function draftToConfig(draft: ConfigDraft): JiraEditableConfigView {
  const baseUrl = text(draft.baseUrl)
  const tokenCredentialRef = text(draft.tokenCredentialRef)
  const username = text(draft.username)
  const assignedJql = text(draft.assignedJql)
  const watchingJql = text(draft.watchingJql)
  const reportedJql = text(draft.reportedJql)
  const workBoardSyncJql = text(draft.workBoardSyncJql)
  const workBoardDoneTransition = text(draft.workBoardDoneTransition)
  const workBoardFailedTransition = text(draft.workBoardFailedTransition)
  const manualTransitions = draft.workBoardManualTransitions.split(',').map(item => item.trim()).filter(item => item.length > 0)
  const workBoardProjectMappings = projectMappingsFromDraft(draft.workBoardProjectMappings)
  return {
    ...(baseUrl === undefined ? {} : { baseUrl }),
    authMode: draft.authMode,
    ...(tokenCredentialRef === undefined ? {} : { tokenCredentialRef }),
    ...(username === undefined ? {} : { username }),
    strictTls: draft.strictTls,
    timeoutMs: draft.timeoutMs,
    maxResults: draft.maxResults,
    ...(assignedJql === undefined ? {} : { assignedJql }),
    ...(watchingJql === undefined ? {} : { watchingJql }),
    ...(reportedJql === undefined ? {} : { reportedJql }),
    workBoardSync: draft.workBoardSync,
    ...(workBoardSyncJql === undefined ? {} : { workBoardSyncJql }),
    workBoardSyncIntervalMs: draft.workBoardSyncIntervalMs,
    workBoardWriteback: draft.workBoardWriteback,
    ...(workBoardDoneTransition === undefined ? {} : { workBoardDoneTransition }),
    ...(workBoardFailedTransition === undefined ? {} : { workBoardFailedTransition }),
    ...(manualTransitions.length === 0 ? {} : { workBoardManualTransitions: manualTransitions }),
    ...(workBoardProjectMappings.length === 0 ? {} : { workBoardProjectMappings }),
  }
}

export function JiraPanel({ open, onClose, port, t }: JiraPanelProps) {
  const [status, setStatus] = useState<JiraConnectionStatusView | undefined>()
  const [configView, setConfigView] = useState<JiraConfigEditorView | undefined>()
  const [configDraft, setConfigDraft] = useState<ConfigDraft>(() => draftFromConfig({}))
  const [credentialValue, setCredentialValue] = useState('')
  const [view, setView] = useState<JiraIssueView>('assigned')
  const [customJql, setCustomJql] = useState('')
  const [result, setResult] = useState<JiraSearchResult | undefined>()
  const [selectedKey, setSelectedKey] = useState<string | undefined>()
  const [detail, setDetail] = useState<JiraIssueDetail | undefined>()
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState<BusyAction>()
  const [error, setError] = useState<string | undefined>()
  const [notice, setNotice] = useState<string | undefined>()
  const issue = useMemo(() => selectedIssue(result?.issues ?? [], selectedKey), [result, selectedKey])

  const loadConfig = async () => {
    setBusy('config')
    setError(undefined)
    try {
      const next = await port.config()
      setConfigView(next)
      setConfigDraft(draftFromConfig(next.effective))
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
    } finally {
      setBusy(undefined)
    }
  }

  const saveConfig = async () => {
    setBusy('config')
    setError(undefined)
    setNotice(undefined)
    try {
      const next = await port.saveConfig({ config: draftToConfig(configDraft) })
      if (credentialValue.trim().length > 0) {
        await port.saveCredential({ credentialRef: configDraft.tokenCredentialRef, value: credentialValue })
        setCredentialValue('')
      }
      setConfigView(next)
      setConfigDraft(draftFromConfig(next.effective))
      setNotice(t('panel.configSaved' as JiraTrackerKey))
      await loadStatus()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
    } finally {
      setBusy(undefined)
    }
  }

  const loadStatus = async () => {
    setBusy('status')
    setError(undefined)
    try {
      setStatus(await port.status())
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
    } finally {
      setBusy(undefined)
    }
  }

  const search = async (nextView = view) => {
    setBusy('search')
    setError(undefined)
    setNotice(undefined)
    try {
      const next = await port.search({ view: nextView, ...nextView === 'custom' ? { jql: customJql } : {} })
      setResult(next)
      setSelectedKey(current => next.issues.some(item => item.key === current) ? current : next.issues[0]?.key)
      setDetail(undefined)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
    } finally {
      setBusy(undefined)
    }
  }

  const loadIssue = async (issueKey: string) => {
    setBusy('issue')
    setError(undefined)
    try {
      setDetail(await port.getIssue({ issueKey }))
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
    } finally {
      setBusy(undefined)
    }
  }

  const submitComment = async () => {
    if (detail === undefined || comment.trim().length === 0) return
    setBusy('comment')
    setError(undefined)
    setNotice(undefined)
    try {
      const mutation = await port.addComment({ issueKey: detail.key, body: comment.trim() })
      setComment('')
      setNotice(mutation.message)
      setDetail(await port.getIssue({ issueKey: detail.key }))
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
    } finally {
      setBusy(undefined)
    }
  }

  const transition = async (transitionId: string) => {
    if (detail === undefined) return
    setBusy('transition')
    setError(undefined)
    setNotice(undefined)
    try {
      const mutation = await port.transitionIssue({ issueKey: detail.key, transitionId })
      setNotice(mutation.message)
      setDetail(await port.getIssue({ issueKey: detail.key }))
      await search(view)
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : String(nextError))
    } finally {
      setBusy(undefined)
    }
  }

  useEffect(() => {
    if (!open || status !== undefined || busy !== undefined) return
    void Promise.all([loadStatus(), loadConfig()]).then(() => { void search('assigned') })
  }, [open])

  useEffect(() => {
    if (issue === undefined || detail?.key === issue.key || busy === 'issue') return
    void loadIssue(issue.key)
  }, [issue?.key])

  if (!open) return null

  return (
    <div className={css.popover} role="dialog" aria-label={t('panel.title')}>
      <div className={css.header}>
        <div>
          <p className={css.title}>{t('panel.title')}</p>
          <p className={css.subtitle}>{t('panel.subtitle')}</p>
        </div>
        <button type="button" className={css.iconButton} onClick={onClose} aria-label={t('panel.close')}>×</button>
      </div>

      <section className={css.statusBox}>
        <div>
          <p className={css.sectionTitle}>{t('panel.status')}</p>
          <p className={css.subtitle}>{status === undefined ? t('panel.loading') : statusLabel(status.status, t)}</p>
        </div>
        <button type="button" className={css.primaryButton} disabled={busy !== undefined} onClick={() => { void loadStatus() }}>
          {busy === 'status' ? t('panel.refreshing') : t('panel.refresh')}
        </button>
        {status !== undefined && (
          <div className={css.configGrid}>
            <span>{t('panel.baseUrl')}</span><strong>{status.config.baseUrl ?? '—'}</strong>
            <span>{t('panel.credential')}</span><strong>{status.config.credentialRef} · {status.credentialConfigured ? 'configured' : 'missing'}</strong>
            <span>{t('panel.user')}</span><strong>{status.user?.displayName ?? status.user?.name ?? t('panel.noUser')}</strong>
          </div>
        )}
      </section>

      <section className={css.configBox}>
        <div className={css.configHeader}>
          <div>
            <p className={css.sectionTitle}>{t('panel.connectionSettings' as JiraTrackerKey)}</p>
            <p className={css.subtitle}>{configView === undefined ? t('panel.loading') : t('panel.configPath' as JiraTrackerKey, { path: configView.path })}</p>
          </div>
          <button type="button" className={css.primaryButton} disabled={busy !== undefined} onClick={() => { void saveConfig() }}>
            {busy === 'config' ? t('panel.saving' as JiraTrackerKey) : t('panel.saveConfig' as JiraTrackerKey)}
          </button>
        </div>
        <div className={css.formGrid}>
          <label><span>{t('panel.baseUrl')}</span><input value={configDraft.baseUrl} placeholder="https://jira.example.com" onChange={event => { setConfigDraft(current => ({ ...current, baseUrl: event.target.value })) }} /></label>
          <label><span>{t('panel.authMode' as JiraTrackerKey)}</span><select value={configDraft.authMode} onChange={event => { setConfigDraft(current => ({ ...current, authMode: event.target.value === 'basic' ? 'basic' : 'pat' })) }}><option value="pat">PAT</option><option value="basic">Basic</option></select></label>
          <label><span>{t('panel.username' as JiraTrackerKey)}</span><input value={configDraft.username} placeholder={t('panel.usernamePlaceholder' as JiraTrackerKey)} onChange={event => { setConfigDraft(current => ({ ...current, username: event.target.value })) }} /></label>
          <label><span>{t('panel.credential')}</span><input value={configDraft.tokenCredentialRef} placeholder="JIRA_API_TOKEN" onChange={event => { setConfigDraft(current => ({ ...current, tokenCredentialRef: event.target.value })) }} /></label>
          <label><span>{t('panel.credentialValue' as JiraTrackerKey)}</span><input type="password" value={credentialValue} placeholder={t('panel.credentialValuePlaceholder' as JiraTrackerKey)} onChange={event => { setCredentialValue(event.target.value) }} /></label>
          <label><span>{t('panel.timeoutMs' as JiraTrackerKey)}</span><input type="number" min={1000} value={configDraft.timeoutMs} onChange={event => { setConfigDraft(current => ({ ...current, timeoutMs: Number(event.target.value) })) }} /></label>
          <label><span>{t('panel.maxResults' as JiraTrackerKey)}</span><input type="number" min={1} max={100} value={configDraft.maxResults} onChange={event => { setConfigDraft(current => ({ ...current, maxResults: Number(event.target.value) })) }} /></label>
          <label className={css.checkboxLabel}><input type="checkbox" checked={configDraft.strictTls} onChange={event => { setConfigDraft(current => ({ ...current, strictTls: event.target.checked })) }} /><span>{t('panel.strictTls' as JiraTrackerKey)}</span></label>
          <label className={css.checkboxLabel}><input type="checkbox" checked={configDraft.workBoardSync} onChange={event => { setConfigDraft(current => ({ ...current, workBoardSync: event.target.checked })) }} /><span>{t('panel.workBoardSync' as JiraTrackerKey)}</span></label>
          <label className={css.wideField}><span>{t('panel.syncJql' as JiraTrackerKey)}</span><input value={configDraft.workBoardSyncJql} onChange={event => { setConfigDraft(current => ({ ...current, workBoardSyncJql: event.target.value })) }} /></label>
          <label><span>{t('panel.syncInterval' as JiraTrackerKey)}</span><input type="number" min={30000} step={1000} value={configDraft.workBoardSyncIntervalMs} onChange={event => { setConfigDraft(current => ({ ...current, workBoardSyncIntervalMs: Number(event.target.value) })) }} /></label>
          <label className={css.checkboxLabel}><input type="checkbox" checked={configDraft.workBoardWriteback} onChange={event => { setConfigDraft(current => ({ ...current, workBoardWriteback: event.target.checked })) }} /><span>{t('panel.workBoardWriteback' as JiraTrackerKey)}</span></label>
          <label><span>{t('panel.doneTransition' as JiraTrackerKey)}</span><input value={configDraft.workBoardDoneTransition} placeholder="Done" onChange={event => { setConfigDraft(current => ({ ...current, workBoardDoneTransition: event.target.value })) }} /></label>
          <label><span>{t('panel.failedTransition' as JiraTrackerKey)}</span><input value={configDraft.workBoardFailedTransition} placeholder="Blocked" onChange={event => { setConfigDraft(current => ({ ...current, workBoardFailedTransition: event.target.value })) }} /></label>
          <label className={css.wideField}><span>{t('panel.manualTransitions' as JiraTrackerKey)}</span><input value={configDraft.workBoardManualTransitions} placeholder="Done, In Progress, Blocked" onChange={event => { setConfigDraft(current => ({ ...current, workBoardManualTransitions: event.target.value })) }} /></label>
          <label className={css.wideField}><span>{t('panel.projectMappings' as JiraTrackerKey)}</span><textarea className={css.mappingTextArea} value={configDraft.workBoardProjectMappings} placeholder={t('panel.projectMappingsPlaceholder' as JiraTrackerKey)} onChange={event => { setConfigDraft(current => ({ ...current, workBoardProjectMappings: event.target.value })) }} /></label>
        </div>
      </section>

      {error !== undefined && <p className={css.error}>{error}</p>}
      {notice !== undefined && <p className={css.notice}>{notice}</p>}

      <div className={css.toolbar}>
        {(['assigned', 'watching', 'reported', 'custom'] as const).map(item => (
          <button
            key={item}
            type="button"
            className={clsx(css.tabButton, view === item && css.tabButtonActive)}
            onClick={() => {
              setView(item)
              if (item !== 'custom') void search(item)
            }}
          >
            {viewLabel(item, t)}
          </button>
        ))}
        {view === 'custom' && (
          <>
            <input className={css.jqlInput} value={customJql} placeholder={t('panel.customPlaceholder')} onChange={event => { setCustomJql(event.target.value) }} />
            <button type="button" className={css.primaryButton} disabled={busy !== undefined} onClick={() => { void search('custom') }}>{t('panel.search')}</button>
          </>
        )}
        {view !== 'custom' && (
          <button type="button" className={css.primaryButton} disabled={busy !== undefined} onClick={() => { void search(view) }}>
            {busy === 'search' ? t('panel.refreshing') : t('panel.refresh')}
          </button>
        )}
      </div>

      <div className={css.content}>
        <div className={css.issueList}>
          {busy === 'search' && <p className={css.empty}>{t('panel.loading')}</p>}
          {busy !== 'search' && (result?.issues.length ?? 0) === 0 && <p className={css.empty}>{t('panel.noIssues')}</p>}
          {result?.total !== undefined && <p className={css.total}>{t('panel.total', { count: result.total })}</p>}
          {result?.issues.map(item => (
            <button key={item.key} type="button" className={clsx(css.issueCard, item.key === issue?.key && css.issueCardActive)} onClick={() => { setSelectedKey(item.key) }}>
              <span className={css.issueKey}>{item.key}</span>
              <strong>{item.summary}</strong>
              <small>{item.status} · {item.assignee ?? 'Unassigned'} · {dateLabel(item.updated)}</small>
            </button>
          ))}
        </div>

        <div className={css.detail}>
          {issue === undefined ? (
            <p className={css.empty}>{busy === 'search' ? t('panel.loading') : t('panel.selectIssue')}</p>
          ) : detail === undefined || detail.key !== issue.key ? (
            <p className={css.empty}>{t('panel.loading')}</p>
          ) : (
            <>
              <div className={css.detailTop}>
                <div>
                  <p className={css.detailTitle}>{detail.key} · {detail.summary}</p>
                  <p className={css.detailMeta}>{detail.status} · {detail.issueType ?? 'Issue'} · {dateLabel(detail.updated)}</p>
                </div>
                <a className={css.openLink} href={detail.url} target="_blank" rel="noreferrer">{t('panel.open')}</a>
              </div>

              <section className={css.section}>
                <p className={css.sectionTitle}>{t('panel.description')}</p>
                <p className={css.description}>{detail.description ?? t('panel.none')}</p>
              </section>

              <section className={css.section}>
                <p className={css.sectionTitle}>{t('panel.transitions')}</p>
                <div className={css.transitions}>
                  {detail.transitions.length === 0 && <span className={css.empty}>{t('panel.none')}</span>}
                  {detail.transitions.map(item => (
                    <button key={item.id} type="button" disabled={busy !== undefined} onClick={() => { void transition(item.id) }}>
                      {busy === 'transition' ? t('panel.transitioning') : item.name}
                    </button>
                  ))}
                </div>
              </section>

              <section className={css.section}>
                <p className={css.sectionTitle}>{t('panel.addComment')}</p>
                <textarea className={css.commentBox} value={comment} placeholder={t('panel.commentPlaceholder')} onChange={event => { setComment(event.target.value) }} />
                <button type="button" className={css.primaryButton} disabled={busy !== undefined || comment.trim().length === 0} onClick={() => { void submitComment() }}>
                  {busy === 'comment' ? t('panel.commenting') : t('panel.addComment')}
                </button>
              </section>

              <section className={css.section}>
                <p className={css.sectionTitle}>{t('panel.comments')}</p>
                {detail.comments.length === 0 && <p className={css.empty}>{t('panel.none')}</p>}
                {detail.comments.map(item => (
                  <div className={css.comment} key={item.id}>
                    <strong>{item.author ?? 'Unknown'} · {dateLabel(item.updated ?? item.created)}</strong>
                    <p>{item.body}</p>
                  </div>
                ))}
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
