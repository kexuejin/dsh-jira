import { afterEach, describe, expect, it, vi } from 'vitest'
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import { Context } from '@deepseek-ai/cordis'
import { CredentialProvider, credentialRef, type CredentialInfo, type CredentialRef, type ResolvedCredential } from '@deepseek-ai/dsh-credentials'
import { JiraClient, internals, resolveConfig } from '../src/jira.ts'

class MemoryCredentials extends CredentialProvider {
  readonly values = new Map<string, string>()

  async resolve(ref: CredentialRef): Promise<ResolvedCredential | undefined> {
    const value = this.values.get(ref)
    return value === undefined ? undefined : { value, source: 'memory' }
  }

  async describe(ref: CredentialRef): Promise<CredentialInfo> {
    return { configured: this.values.has(ref), writable: true, ...this.values.has(ref) ? { source: 'memory' } : {} }
  }

  async set(ref: CredentialRef, value: string): Promise<void> {
    this.values.set(ref, value)
  }

  async unset(ref: CredentialRef): Promise<void> {
    this.values.delete(ref)
  }
}

const servers: Server[] = []

type Handler = (request: IncomingMessage, response: ServerResponse) => void

function listen(handler: Handler): Promise<{ readonly server: Server; readonly baseUrl: string }> {
  const server = createServer(handler)
  servers.push(server)
  return new Promise((resolve, reject) => {
    server.on('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address() as AddressInfo
      resolve({ server, baseUrl: `http://127.0.0.1:${String(address.port)}` })
    })
  })
}

function json(response: ServerResponse, value: unknown): void {
  response.writeHead(200, { 'content-type': 'application/json' })
  response.end(JSON.stringify(value))
}

async function contextWithCredential(token = 'jira-token'): Promise<{ readonly ctx: Context; readonly dispose: () => Promise<void> }> {
  const ctx = new Context()
  const fiber = await ctx.plugin(MemoryCredentials)
  await ctx.credentials.set(credentialRef('JIRA_API_TOKEN'), token)
  return { ctx, dispose: () => fiber.dispose() }
}

afterEach(async () => {
  await Promise.all(servers.splice(0).map(server => new Promise<void>((resolve) => { server.close(() => { resolve() }) })))
})

describe('JiraClient', () => {
  it('uses bearer PAT authentication for Jira Data Center requests', async () => {
    let authorization = ''
    const { baseUrl } = await listen((request, response) => {
      authorization = request.headers.authorization ?? ''
      json(response, { issues: [], startAt: 0, maxResults: 25, total: 0 })
    })
    const { ctx, dispose } = await contextWithCredential()
    const client = new JiraClient(ctx, resolveConfig({ baseUrl }))

    await client.search({ view: 'assigned' })

    expect(authorization).toBe('Bearer jira-token')
    await dispose()
  })

  it('normalizes issue summaries from Jira search responses', async () => {
    const { baseUrl } = await listen((_request, response) => {
      json(response, {
        issues: [{
          id: '10001',
          key: 'ABC-123',
          fields: {
            summary: 'Fix internal bug',
            status: { name: 'In Progress', statusCategory: { name: 'In Progress' } },
            issuetype: { name: 'Bug' },
            priority: { name: 'High' },
            assignee: { displayName: 'John Brown' },
            reporter: { name: 'alice' },
            updated: '2026-08-21T10:00:00.000+0000',
          },
        }],
        total: 1,
      })
    })
    const { ctx, dispose } = await contextWithCredential()
    const client = new JiraClient(ctx, resolveConfig({ baseUrl }))

    const result = await client.search({ view: 'assigned' })

    expect(result.issues[0]).toEqual({
      id: '10001',
      key: 'ABC-123',
      summary: 'Fix internal bug',
      status: 'In Progress',
      statusCategory: 'In Progress',
      issueType: 'Bug',
      priority: 'High',
      assignee: 'John Brown',
      reporter: 'alice',
      updated: '2026-08-21T10:00:00.000+0000',
      url: `${baseUrl}/browse/ABC-123`,
    })
    await dispose()
  })

  it('rejects redirects on credential-bearing requests', async () => {
    let redirectTargetHit = false
    const target = await listen((_request, response) => {
      redirectTargetHit = true
      json(response, { issues: [] })
    })
    const source = await listen((_request, response) => {
      response.writeHead(302, { location: `${target.baseUrl}/capture` })
      response.end()
    })
    const { ctx, dispose } = await contextWithCredential()
    const client = new JiraClient(ctx, resolveConfig({ baseUrl: source.baseUrl }))

    await expect(client.search({ view: 'assigned' })).rejects.toThrow(/redirected/)
    expect(redirectTargetHit).toBe(false)
    await dispose()
  })

  it('builds basic auth only when username is configured', () => {
    expect(internals.buildAuthHeader(resolveConfig({ authMode: 'pat' }), 'token')).toBe('Bearer token')
    expect(internals.buildAuthHeader(resolveConfig({ authMode: 'basic', username: 'john' }), 'secret')).toMatch(/^Basic /u)
    expect(() => internals.buildAuthHeader(resolveConfig({ authMode: 'basic' }), 'secret')).toThrow(/username/)
  })
})

describe('JiraWorkSource', () => {
  it('maps unresolved assigned issues onto board work items with resolvable ids', async () => {
    const { baseUrl } = await listen((request, response) => {
      if (request.url?.includes('/rest/api/2/issue/ABC-1')) {
        json(response, {
          key: 'ABC-1',
          fields: {
            summary: 'Fix internal bug',
            status: { name: 'In Progress', statusCategory: { name: 'In Progress' } },
          },
        })
        return
      }
      json(response, {
        issues: [{
          key: 'ABC-1',
          fields: {
            summary: 'Fix internal bug',
            status: { name: 'In Progress', statusCategory: { name: 'In Progress' } },
            priority: { name: 'High' },
            updated: '2026-08-21T10:00:00.000+0000',
          },
        }],
        total: 1,
      })
    })
    const { ctx, dispose } = await contextWithCredential()
    const source = (await import('../src/work-source.ts')).createJiraWorkSource(ctx, resolveConfig({ baseUrl }))

    const items = await source.list({ filterId: 'mine' })

    expect(items.length).toBe(1)
    expect(items[0]).toMatchObject({ id: 'jira:ABC-1', sourceId: 'jira', externalId: 'ABC-1', status: 'running' })
    const detail = await source.get('jira:ABC-1')
    expect(detail?.title).toBe('Fix internal bug')
    expect((await source.actions(detail!)).some(action => action.id === 'start')).toBe(true)

    await dispose()
  })

  it('returns undefined for a malformed board id', async () => {
    const { baseUrl } = await listen(() => {})
    const { ctx, dispose } = await contextWithCredential()
    const source = (await import('../src/work-source.ts')).createJiraWorkSource(ctx, resolveConfig({ baseUrl }))

    expect(await source.get('nope')).toBeUndefined()

    await dispose()
  })
})

describe('JiraWorkBoardSync', () => {
  it('starts a dormant sync loop before baseUrl is configured', async () => {
    const ctx = new Context()
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const synced: unknown[] = []
    await ctx.plugin({
      apply(child: Context) {
        child.provide('workBoard', {
          syncManualTasks(_sourceId: string, tasks: readonly unknown[]) {
            synced.push(...tasks)
            return { tasks }
          },
          manualSnapshot() {
            return { tasks: [] }
          },
        })
      },
    }).await()
    const { registerJiraWorkBoardSync } = await import('../src/work-board-sync.ts')

    registerJiraWorkBoardSync(ctx, {})
    await new Promise(resolve => setTimeout(resolve, 5))

    expect(setIntervalSpy).toHaveBeenCalledOnce()
    expect(synced).toEqual([])
    setIntervalSpy.mockRestore()
  })

  it('syncs Jira issues into the Work Board manual ledger', async () => {
    const { baseUrl } = await listen((_request, response) => {
      json(response, {
        issues: [{
          key: 'ABC-9',
          fields: {
            summary: 'Implement board sync',
            status: { name: 'To Do', statusCategory: { name: 'To Do' } },
            priority: { name: 'High' },
            assignee: { displayName: 'James' },
            reporter: { displayName: 'Alice' },
            created: '2026-08-21T09:00:00.000+0000',
            updated: '2026-08-21T10:00:00.000+0000',
          },
        }],
        total: 1,
      })
    })
    const { ctx, dispose } = await contextWithCredential()
    const synced: unknown[] = []
    await ctx.plugin({
      apply(child: Context) {
        child.provide('workBoard', {
          syncManualTasks(_sourceId: string, tasks: readonly unknown[]) {
            synced.push(...tasks)
            return { tasks }
          },
          manualSnapshot() {
            return { tasks: [] }
          },
        })
      },
    }).await()
    const { registerJiraWorkBoardSync } = await import('../src/work-board-sync.ts')

    registerJiraWorkBoardSync(ctx, {
      baseUrl,
      workBoardSyncIntervalMs: 30000,
      workBoardProjectMappings: [{
        projectKey: 'ABC',
        workspaceId: '/Volumes/Kapp/source/app',
        mode: 'default',
        permission: 'workspace-write',
      }],
    })
    await new Promise(resolve => setTimeout(resolve, 30))

    expect(synced[0]).toMatchObject({
      id: 'jira:ABC-9',
      title: '[ABC-9] Implement board sync',
      status: 'todo',
      workspaceId: '/Volumes/Kapp/source/app',
      mode: 'default',
      permission: 'workspace-write',
    })
    await dispose()
  })
})
