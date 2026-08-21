import type { TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { JiraTrackerKey } from './locales.ts'
import css from './JiraPanel.module.css'
import { mountSidebarEntry as mountSharedSidebarEntry } from './sidebar-entry-core.ts'

export const ENTRY_SELECTOR = '[data-dsh-jira-entry]'

const ICON = '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4.2 2.2h5.9l2 2v9.6H4.2z"/><path d="M10.1 2.2v2h2"/><path d="M6.2 7h4"/><path d="M6.2 9.4h3"/><path d="M2 4.2h2.2"/><path d="M2 7.4h2.2"/><path d="M2 10.6h2.2"/></svg>'

export interface JiraEntryController {
  toggle(): void
  subscribe(listener: () => void): () => void
  isOpen(): boolean
}

export function mountSidebarEntry(
  controller: JiraEntryController,
  t: TranslateNS<'jiraTracker'>,
): () => void {
  return mountSharedSidebarEntry({
    rowAttribute: 'data-dsh-jira-entry',
    rowSelector: ENTRY_SELECTOR,
    plugin: 'dsh-jira',
    icon: ICON,
    css,
    label: () => t('panel.trigger' as JiraTrackerKey),
    tooltip: () => t('panel.title' as JiraTrackerKey),
    onToggle: () => { controller.toggle() },
    position: 'after',
    familySelectors: [
      '[data-dsh-taskboard-entry]',
      '[data-dsh-ssh-entry]',
      '[data-dsh-release-console-entry]',
      '[data-dsh-jira-entry]',
    ],
    active: {
      subscribe: listener => controller.subscribe(listener),
      isOpen: () => controller.isOpen(),
    },
  })
}
