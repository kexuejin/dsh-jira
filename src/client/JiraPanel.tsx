import { useEffect, useMemo, useState } from 'react'
import clsx from 'clsx'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type {
  JiraAddCommentArgs,
  JiraConnectionStatusView,
  JiraGetIssueArgs,
  JiraGetTransitionsArgs,
  JiraIssueDetail,
  JiraIssueSummary,
  JiraIssueView,
  JiraMutationResult,
  JiraSearchArgs,
  JiraSearchResult,
  JiraTransition,
  JiraTransitionIssueArgs,
} from '../model.ts'
import css from './JiraPanel.module.css'
import type { JiraTrackerKey } from './locales.ts'

export interface JiraPanelPort {
  status: () => Promise<JiraConnectionStatusView>
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

type BusyAction = 'status' | 'search' | 'issue' | 'comment' | 'transition' | undefined

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

export function JiraPanel({ open, onClose, port, t }: JiraPanelProps) {
  const [status, setStatus] = useState<JiraConnectionStatusView | undefined>()
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
    void loadStatus().then(() => { void search('assigned') })
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
