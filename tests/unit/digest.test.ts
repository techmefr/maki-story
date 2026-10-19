import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runDailyDigests } from '../../functional/Notification/server/utils/digestRunner.ts'

const batch = { accountId: 'account', itemIds: ['one', 'two'] }
const now = new Date('2026-10-19T07:00:00Z')

const setup = (isSuccessful = true) => {
    const claims = new Set<string>()
    const delivered: string[] = []
    const completed: string[] = []
    const store = {
        pending: async () => [batch],
        claim: async (item: typeof batch, day: string) => {
            const key = `${item.accountId}:${day}`
            if (claims.has(key)) {
                return false
            }
            claims.add(key)
            return true
        },
        deliver: async (item: typeof batch) => {
            delivered.push(item.accountId)
            return isSuccessful
        },
        complete: async (item: typeof batch) => { completed.push(...item.itemIds) },
    }
    return { store, claims, delivered, completed }
}

test('concurrent daily jobs deliver once per account and day', async () => {
    const { store, delivered, completed } = setup()
    const results = await Promise.all([runDailyDigests(store, now), runDailyDigests(store, now)])
    assert.equal(results.reduce((sum, result) => sum + result.sent, 0), 1)
    assert.deepEqual(delivered, ['account'])
    assert.deepEqual(completed, ['one', 'two'])
})

test('an ambiguous delivery failure is not retried on the same day', async () => {
    const { store, delivered, completed } = setup(false)
    assert.deepEqual(await runDailyDigests(store, now), { sent: 0, failed: 1 })
    assert.deepEqual(await runDailyDigests(store, now), { sent: 0, failed: 0 })
    assert.equal(delivered.length, 1)
    assert.deepEqual(completed, [])
    await runDailyDigests(store, new Date('2026-10-20T07:00:00Z'))
    assert.equal(delivered.length, 2)
})

test('empty preference-filtered batches never reserve a daily delivery', async () => {
    const { store, claims } = setup()
    await runDailyDigests({ ...store, pending: async () => [{ ...batch, itemIds: [] }] }, now)
    assert.equal(claims.size, 0)
})

test('one delivery failure does not block another account', async () => {
    const { store, completed } = setup()
    const results = await runDailyDigests({
        ...store,
        pending: async () => [batch, { accountId: 'other', itemIds: ['three'] }],
        deliver: async item => {
            if (item.accountId === 'account') {
                throw new Error('Timeout after acceptance')
            }
            return true
        },
    }, now)
    assert.deepEqual(results, { sent: 1, failed: 1 })
    assert.deepEqual(completed, ['three'])
})
