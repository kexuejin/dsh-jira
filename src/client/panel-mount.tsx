/**
 * Jira view mounting.
 *
 * The `conversation` slot is single-occupant and external plugins cannot
 * declare slots, so the Jira panel takes over the center column at the DOM
 * level exactly like dsh-work-board: a container is appended inside the
 * center column (`[data-pane="conversation"]` / `[class*="centerCol"]`) as an
 * extra trailing child, and a stylesheet rule hides the conversation content
 * while the panel is active. Toggling is a data attribute on <html>, so the
 * conversation subtree underneath stays mounted and stateful.
 */
import { createRoot, type Root } from 'react-dom/client'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { JiraPanel, type JiraPanelPort } from './JiraPanel.tsx'
import css from './JiraPanel.module.css'

const ACTIVE_EVENT = 'dsh-panel-activate'
const PANEL_NAME = 'jira'
const CONVERSATION_COLUMN_SELECTOR = '[data-pane="conversation"], [class*="centerCol"]'
const ACTIVE_ATTR = 'data-dsh-jira-active'
/** Sibling center-column panels evicted when this panel opens. */
const OTHER_ACTIVE_ATTRS = [
  'data-dsh-work-board-active',
  'data-dsh-taskboard-active',
  'data-dsh-ssh-active',
] as const
/** Sibling panel activation details that close this panel. */
const OTHER_PANELS = new Set<string>(['workboard', 'taskboard', 'ssh'])
/** Sidebar rows that hand the center column back to the conversation. */
const SIDEBAR_ROW_SELECTOR = '[class*="sessionRow"], [class*="projectRow"], [class*="searchResultRow"], [class*="searchResultWorkspace"], [class*="newSession"]'

export interface JiraController {
  open(): void
  close(): void
  toggle(): void
  subscribe(listener: () => void): () => void
  isOpen(): boolean
  dispose(): void
}

/** Find the center column, or undefined while the frame is not mounted. */
function conversationColumn(): HTMLElement | undefined {
  return document.querySelector<HTMLElement>(CONVERSATION_COLUMN_SELECTOR) ?? undefined
}

class JiraControllerImpl implements JiraController {
  private openState = false
  private readonly listeners = new Set<() => void>()
  private root: Root | undefined
  private container: HTMLDivElement | undefined
  private waitObserver: MutationObserver | undefined
  private readonly onOtherActivate = (event: Event): void => {
    const name = String((event as CustomEvent).detail)
    if (name !== PANEL_NAME && OTHER_PANELS.has(name) && this.openState) this.close()
  }
  private readonly onEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.openState) this.close()
  }
  private readonly onClickSidebarRow = (event: MouseEvent): void => {
    if (!this.openState) return
    const target = event.target as HTMLElement | null
    if (target === null) return
    if (target.closest(SIDEBAR_ROW_SELECTOR) !== null) this.close()
  }

  constructor(
    private readonly port: JiraPanelPort,
    private readonly t: TranslateNS<'jiraTracker'>,
  ) {
    document.addEventListener(ACTIVE_EVENT, this.onOtherActivate)
    document.addEventListener('keydown', this.onEscape)
    document.addEventListener('click', this.onClickSidebarRow, true)
  }

  open(): void {
    if (!this.openState) {
      this.openState = true
      document.dispatchEvent(new CustomEvent(ACTIVE_EVENT, { detail: PANEL_NAME }))
      this.notify()
    }
    this.applyActive()
    this.render()
  }

  close(): void {
    if (!this.openState) return
    this.openState = false
    this.notify()
    this.applyActive()
    this.render()
  }

  toggle(): void {
    if (this.openState) this.close()
    else this.open()
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => { this.listeners.delete(listener) }
  }

  isOpen(): boolean {
    return this.openState
  }

  dispose(): void {
    document.removeEventListener(ACTIVE_EVENT, this.onOtherActivate)
    document.removeEventListener('keydown', this.onEscape)
    document.removeEventListener('click', this.onClickSidebarRow, true)
    this.waitObserver?.disconnect()
    this.root?.unmount()
    this.root = undefined
    this.container?.remove()
    this.container = undefined
    document.documentElement.removeAttribute(ACTIVE_ATTR)
    this.listeners.clear()
  }

  private notify(): void {
    for (const listener of [...this.listeners]) listener()
  }

  private applyActive(): void {
    if (this.openState) {
      for (const attr of OTHER_ACTIVE_ATTRS) document.documentElement.removeAttribute(attr)
      document.documentElement.setAttribute(ACTIVE_ATTR, '')
    } else {
      document.documentElement.removeAttribute(ACTIVE_ATTR)
    }
  }

  private ensureContainer(): void {
    if (this.container !== undefined) return
    const column = conversationColumn()
    if (column === undefined) return
    this.container = document.createElement('div')
    this.container.setAttribute('data-dsh-jira-view', '')
    this.container.dataset.dshPlugin = 'dsh-jira'
    this.container.className = css.view
    column.appendChild(this.container)
    this.root = createRoot(this.container)
    this.render()
  }

  private render(): void {
    if (this.container === undefined) {
      this.waitObserver ??= new MutationObserver(() => { this.ensureContainer() })
      this.waitObserver.observe(document.body, { childList: true, subtree: true })
      this.ensureContainer()
      return
    }
    this.root?.render(
      <JiraPanel
        open={this.openState}
        onClose={() => { this.close() }}
        port={this.port}
        t={this.t}
      />,
    )
  }
}

export function createJiraController(
  port: JiraPanelPort,
  t: TranslateNS<'jiraTracker'>,
): JiraController {
  const controller = new JiraControllerImpl(port, t)
  controller.close()
  return controller
}
