import { createRoot, type Root } from 'react-dom/client'
import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import { JiraPanel, type JiraPanelPort } from './JiraPanel.tsx'
import css from './JiraPanel.module.css'

const ACTIVE_EVENT = 'dsh-panel-activate'
const PANEL_NAME = 'jira-tracker'
const VIEW_SELECTOR = '[data-dsh-jira-view]'

export interface JiraController {
  open(): void
  close(): void
  toggle(): void
  subscribe(listener: () => void): () => void
  isOpen(): boolean
  dispose(): void
}

class JiraControllerImpl implements JiraController {
  private openState = false
  private readonly listeners = new Set<() => void>()
  private root: Root | undefined
  private container: HTMLDivElement | undefined
  private readonly onOtherActivate = (event: Event): void => {
    if ((event as CustomEvent).detail !== PANEL_NAME && this.openState) this.close()
  }
  private readonly onEscape = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.openState) this.close()
  }

  constructor(
    private readonly port: JiraPanelPort,
    private readonly t: TranslateNS<'jiraTracker'>,
  ) {
    document.addEventListener(ACTIVE_EVENT, this.onOtherActivate)
    document.addEventListener('keydown', this.onEscape)
  }

  open(): void {
    if (!this.openState) {
      this.openState = true
      document.dispatchEvent(new CustomEvent(ACTIVE_EVENT, { detail: PANEL_NAME }))
      this.notify()
    }
    this.render()
  }

  close(): void {
    if (!this.openState) return
    this.openState = false
    this.notify()
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
    this.root?.unmount()
    this.root = undefined
    this.container?.remove()
    this.container = undefined
    this.listeners.clear()
  }

  private notify(): void {
    for (const listener of [...this.listeners]) listener()
  }

  private ensureContainer(): void {
    if (this.container !== undefined && this.container.isConnected) return
    this.root?.unmount()
    this.container?.remove()
    const existing = document.querySelector<HTMLDivElement>(VIEW_SELECTOR)
    this.container = existing ?? document.createElement('div')
    this.container.dataset.dshJiraView = ''
    this.container.dataset.dshPlugin = 'dsh-jira'
    this.container.className = css.view
    if (!this.container.isConnected) document.body.appendChild(this.container)
    this.root = createRoot(this.container)
  }

  private render(): void {
    this.ensureContainer()
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
