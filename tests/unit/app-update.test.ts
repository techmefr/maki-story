import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canReloadForUpdate, withinUpdateDeadline } from '../../shared/utils/appUpdate.ts'

test('startup update reload is allowed once and guarded against reload loops', () => {
    assert.equal(canReloadForUpdate(null, 100000), true)
    assert.equal(canReloadForUpdate('100000', 100100), false)
    assert.equal(canReloadForUpdate('100000', 160000), true)
    assert.equal(canReloadForUpdate('invalid', 100000), true)
    assert.equal(canReloadForUpdate('200000', 100000), false)
})
test('offline or stalled update checks cannot hold startup indefinitely', async () => {
    await assert.rejects(withinUpdateDeadline(new Promise(() => undefined), 15), /timed out/)
    assert.equal(await withinUpdateDeadline(Promise.resolve('ready'), 100), 'ready')
    await assert.rejects(withinUpdateDeadline(Promise.reject(new Error('offline')), 100), /offline/)
})
