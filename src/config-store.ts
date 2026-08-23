import { mkdirSync, openSync, writeFileSync, fsyncSync, closeSync, chmodSync, renameSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join } from 'node:path'
import type { JiraAuthMode } from './model.ts'
import { resolveConfig, type Config as JiraConfig } from './jira.ts'
import type { JiraWorkBoardSyncConfig } from './work-board-sync.ts'

export interface JiraEditableConfig extends JiraWorkBoardSyncConfig {
  readonly workBoardManualTransitions?: readonly string[]
}

export interface JiraConfigView {
  readonly path: string
  readonly overrides: JiraEditableConfig
  readonly effective: JiraEditableConfig
}

const CONFIG_FILE = 'config-v1.json'

function expandHome(path: string, home: string = homedir()): string {
  if (path === '~') return home
  if (path.startsWith('~/') || path.startsWith('~\\')) return join(home, path.slice(2))
  return path
}

function dshHome(env: NodeJS.ProcessEnv = process.env, home: string = homedir()): string {
  const raw = env.DSH_HOME
  if (raw !== undefined && raw.trim() !== '') {
    const expanded = expandHome(raw.trim(), home)
    return isAbsolute(expanded) ? expanded : join(process.cwd(), expanded)
  }
  return join(home, '.dsh')
}

function configPath(dir: string = join(dshHome(), 'jira')): string {
  return join(dir, CONFIG_FILE)
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : undefined
}

function cleanString(value: unknown): string | undefined {
  const trimmed = typeof value === 'string' ? value.trim() : undefined
  return trimmed === undefined || trimmed.length === 0 ? undefined : trimmed
}

function boolField(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined
}

function numberField(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function authMode(value: unknown): JiraAuthMode | undefined {
  return value === 'pat' || value === 'basic' ? value : undefined
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  return value.map(item => cleanString(item)).filter((item): item is string => item !== undefined)
}

export function sanitizeJiraConfigPatch(value: unknown): JiraEditableConfig {
  const raw = record(value) ?? {}
  const baseUrl = cleanString(raw.baseUrl)
  const mode = authMode(raw.authMode)
  const tokenCredentialRef = cleanString(raw.tokenCredentialRef)
  const username = cleanString(raw.username)
  const strictTls = boolField(raw.strictTls)
  const caCertificatePath = cleanString(raw.caCertificatePath)
  const proxyUrl = cleanString(raw.proxyUrl)
  const timeoutMs = numberField(raw.timeoutMs)
  const maxResults = numberField(raw.maxResults)
  const assignedJql = cleanString(raw.assignedJql)
  const watchingJql = cleanString(raw.watchingJql)
  const reportedJql = cleanString(raw.reportedJql)
  const workBoardSync = boolField(raw.workBoardSync)
  const workBoardSyncJql = cleanString(raw.workBoardSyncJql)
  const workBoardSyncIntervalMs = numberField(raw.workBoardSyncIntervalMs)
  const workBoardWriteback = boolField(raw.workBoardWriteback)
  const workBoardDoneTransition = cleanString(raw.workBoardDoneTransition)
  const workBoardFailedTransition = cleanString(raw.workBoardFailedTransition)
  const workBoardManualTransitions = stringArray(raw.workBoardManualTransitions)
  return {
    ...(baseUrl === undefined ? {} : { baseUrl }),
    ...(mode === undefined ? {} : { authMode: mode }),
    ...(tokenCredentialRef === undefined ? {} : { tokenCredentialRef }),
    ...(username === undefined ? {} : { username }),
    ...(strictTls === undefined ? {} : { strictTls }),
    ...(caCertificatePath === undefined ? {} : { caCertificatePath }),
    ...(proxyUrl === undefined ? {} : { proxyUrl }),
    ...(timeoutMs === undefined ? {} : { timeoutMs }),
    ...(maxResults === undefined ? {} : { maxResults }),
    ...(assignedJql === undefined ? {} : { assignedJql }),
    ...(watchingJql === undefined ? {} : { watchingJql }),
    ...(reportedJql === undefined ? {} : { reportedJql }),
    ...(workBoardSync === undefined ? {} : { workBoardSync }),
    ...(workBoardSyncJql === undefined ? {} : { workBoardSyncJql }),
    ...(workBoardSyncIntervalMs === undefined ? {} : { workBoardSyncIntervalMs }),
    ...(workBoardWriteback === undefined ? {} : { workBoardWriteback }),
    ...(workBoardDoneTransition === undefined ? {} : { workBoardDoneTransition }),
    ...(workBoardFailedTransition === undefined ? {} : { workBoardFailedTransition }),
    ...(workBoardManualTransitions === undefined ? {} : { workBoardManualTransitions }),
  }
}

function writeJsonAtomic(path: string, value: unknown): void {
  mkdirSync(dirname(path), { recursive: true })
  const tmp = `${path}.tmp-${process.pid}`
  let fd: number | undefined
  try {
    fd = openSync(tmp, 'w', 0o600)
    writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8' })
    fsyncSync(fd)
    closeSync(fd)
    fd = undefined
    try { chmodSync(tmp, 0o600) } catch {}
    renameSync(tmp, path)
  } finally {
    if (fd !== undefined) closeSync(fd)
  }
}

export class JiraConfigStore {
  private overrides: JiraEditableConfig | undefined

  constructor(private readonly base: JiraEditableConfig, private readonly path: string = configPath()) {}

  load(): JiraEditableConfig {
    if (this.overrides !== undefined) return this.overrides
    try {
      this.overrides = sanitizeJiraConfigPatch(JSON.parse(readFileSync(this.path, 'utf8')))
    } catch {
      this.overrides = {}
    }
    return this.overrides
  }

  current(): JiraEditableConfig {
    return { ...this.base, ...this.load() }
  }

  view(): JiraConfigView {
    return { path: this.path, overrides: this.load(), effective: this.current() }
  }

  save(patch: unknown): JiraConfigView {
    const next = sanitizeJiraConfigPatch(patch)
    resolveConfig(next as JiraConfig)
    this.overrides = next
    writeJsonAtomic(this.path, next)
    return this.view()
  }
}
