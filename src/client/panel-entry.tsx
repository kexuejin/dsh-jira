/**
 * The Jira global panel: the sidebar row that selects it and the main-column
 * view it draws.
 *
 * Both ride the frame's own panel slots — `sidebar.panellist` for the row and
 * `main` for the view — so the sidebar shell owns the row's geometry, icon
 * size, tooltip, keyboard behaviour, and selected state, exactly as it does for
 * every other panel. Nothing here reads or writes the sidebar DOM.
 */
import { useEffect, useRef } from 'react'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
// Type-only: pulls the slot registry's Context merge (ctx.slots).
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
// Type-only: pulls the ui-sidebar SlotMap merge ('sidebar.panellist').
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots'
import { JiraPanel, type JiraPanelPort } from './JiraPanel.tsx'
import css from './JiraPanel.module.css'
import { NS, type JiraTrackerKey } from './locales.ts'

/** The main panel key; the sidebar row that addresses it carries the same id. */
export const JIRA_PANEL_ID = 'jira' as MainPanelId

/** Main-column navigation the host frame owns, plus the panel's data port. */
export interface JiraPanelInjected {
  /** The RPC-backed port the panel reads and mutates Jira through. */
  readonly port: JiraPanelPort
  /** Select a main panel, or null to hand the column back to the conversation. */
  readonly selectPanel: (id: MainPanelId | null) => void
}

type MainPanelProps = PropsRuntime<'main'>
  & PropsLocale<typeof NS>
  & InjectFace<JiraPanelInjected>

/**
 * Render the Jira row glyph at the size the sidebar asks for — 16 expanded,
 * 18 in the rail — like every other panel row.
 * @param props - the sidebar's icon share.
 * @returns the tracker glyph.
 */
export function JiraPanelIcon({ size }: PropsRuntime<'sidebar.panellist'>) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.35}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.2 2.2h5.9l2 2v9.6H4.2z" />
      <path d="M10.1 2.2v2h2" />
      <path d="M6.2 7h4" />
      <path d="M6.2 9.4h3" />
      <path d="M2 4.2h2.2" />
      <path d="M2 7.4h2.2" />
      <path d="M2 10.6h2.2" />
    </svg>
  )
}

/**
 * Draw the Jira panel in the main column. Escape and the panel's own close
 * button both hand the column back to the conversation through the frame's
 * panel selection, which is also what clears the sidebar row's selected state.
 * @param props - the injected port and host navigation, plus localized copy.
 * @returns the main-column panel.
 */
export function JiraMainPanel({ port, selectPanel, t }: MainPanelProps) {
  const panelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const timer = window.setTimeout(() => { panelRef.current?.focus() }, 0)
    return () => {
      window.clearTimeout(timer)
      if (previous?.isConnected === true) previous.focus()
    }
  }, [])
  return (
    <div
      ref={panelRef}
      className={css.mainPanel}
      tabIndex={-1}
      aria-label={t('panel.title' as JiraTrackerKey)}
      onKeyDown={(event) => { if (event.key === 'Escape') selectPanel(null) }}
    >
      <JiraPanel port={port} t={t} onClose={() => { selectPanel(null) }} />
    </div>
  )
}
