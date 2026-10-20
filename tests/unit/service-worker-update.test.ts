import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { runInNewContext } from 'node:vm'

type WorkerEvent = { data?: { type: string }; waitUntil: (task: Promise<unknown>) => void }
const worker = (): { events: Record<string, (event: WorkerEvent) => void>; removed: string[]; skipped: () => number } => {
    const events: Record<string, (event: WorkerEvent) => void> = {}
    const removed: string[] = []
    let skips = 0
    runInNewContext(readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8'), {
        self: {
            addEventListener: (name: string, callback: (event: WorkerEvent) => void) => { events[name] = callback },
            skipWaiting: async () => { skips++ },
            clients: { claim: async () => undefined },
        },
        caches: {
            keys: async () => ['tantara-v3', 'tantara-v4', 'tantara-0123456789abcdef', 'tantara-offline-audio', 'another-app'],
            delete: async (name: string) => { removed.push(name) },
            open: async () => ({ addAll: async () => undefined }),
        },
    })
    return { events, removed, skipped: () => skips }
}

test('new worker waits until the app explicitly approves activation', async () => {
    const state = worker()
    let task = Promise.resolve<unknown>(undefined)
    const waitUntil = (pending: Promise<unknown>): void => { task = pending }
    state.events.install!({ waitUntil })
    await task
    assert.equal(state.skipped(), 0)
    state.events.message!({ data: { type: 'UNKNOWN' }, waitUntil })
    assert.equal(state.skipped(), 0)
    state.events.message!({ data: { type: 'SKIP_WAITING' }, waitUntil })
    await task
    assert.equal(state.skipped(), 1)
})

test('activation removes only old interface caches and preserves offline audio and other caches', async () => {
    const state = worker()
    let task = Promise.resolve<unknown>(undefined)
    state.events.activate!({ waitUntil: pending => { task = pending } })
    await task
    assert.deepEqual(state.removed, ['tantara-v3', 'tantara-0123456789abcdef'])
})
