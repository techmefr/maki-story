import { test } from 'node:test'
import assert from 'node:assert/strict'
import { startUpdatePolling, UPDATE_POLL_MS } from '../../shared/utils/updatePolling.ts'

test('open app checks once per minute, skips ineligible states and stops on disposal', async context => {
    context.mock.timers.enable({ apis: ['setInterval'] })
    let eligible = true
    let calls = 0
    const stop = startUpdatePolling(() => eligible, async () => { calls++ })
    context.mock.timers.tick(UPDATE_POLL_MS - 1)
    assert.equal(calls, 0)
    context.mock.timers.tick(1)
    await Promise.resolve()
    await Promise.resolve()
    assert.equal(calls, 1)
    eligible = false
    context.mock.timers.tick(UPDATE_POLL_MS)
    assert.equal(calls, 1)
    eligible = true
    context.mock.timers.tick(UPDATE_POLL_MS)
    await Promise.resolve()
    await Promise.resolve()
    assert.equal(calls, 2)
    stop()
    context.mock.timers.tick(UPDATE_POLL_MS * 2)
    assert.equal(calls, 2)
})

test('slow or failed update checks do not overlap and later checks can recover', async context => {
    context.mock.timers.enable({ apis: ['setInterval'] })
    let calls = 0
    let finish: () => void = () => undefined
    const stop = startUpdatePolling(() => true, () => {
        calls++
        return new Promise<void>((_resolve, reject) => { finish = () => reject(new Error('offline')) })
    })
    context.mock.timers.tick(UPDATE_POLL_MS)
    context.mock.timers.tick(UPDATE_POLL_MS * 3)
    assert.equal(calls, 1)
    finish()
    await Promise.resolve()
    await Promise.resolve()
    context.mock.timers.tick(UPDATE_POLL_MS)
    assert.equal(calls, 2)
    finish()
    await Promise.resolve()
    await Promise.resolve()
    stop()
})
