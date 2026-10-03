import assert from 'node:assert/strict'
import { test } from 'node:test'
import { activeSentBetween, countsTowardQuota, quotaOf, remainingMs, remainingParts } from '../../shared/utils/messageQuota.ts'

const NOW = Date.parse('2026-10-05T10:00:00Z')
const LIMIT = 5

const message = (patch: Partial<IMessage>): IMessage => ({
    id: 'm',
    fromMemberId: 'a',
    toMemberId: 'b',
    fileId: 'f',
    mime: 'audio/webm',
    durationMs: 1000,
    kind: 'NORMAL',
    status: 'ACTIVE',
    listenedAt: null,
    firstListenedAt: null,
    expiresAt: null,
    createdAt: '2026-10-05T09:00:00Z',
    isSaved: false,
    ...patch,
})

test('an unheard message counts and never expires', () => {
    assert.equal(countsTowardQuota(message({}), NOW), true)
})

test('a message past its expiry no longer counts', () => {
    assert.equal(countsTowardQuota(message({ expiresAt: '2026-10-05T09:59:00Z' }), NOW), false)
    assert.equal(countsTowardQuota(message({ expiresAt: '2026-10-05T10:01:00Z' }), NOW), true)
})

test('a message kept in the vault leaves the five', () => {
    assert.equal(countsTowardQuota(message({ isSaved: true }), NOW), false)
})

test('the count is per sender and per recipient, children included', () => {
    const list = [
        message({ id: '1' }),
        message({ id: '2', createdAt: '2026-10-05T08:00:00Z' }),
        message({ id: '3', toMemberId: 'c' }),
        message({ id: '4', fromMemberId: 'b', toMemberId: 'a' }),
        message({ id: '5', isSaved: true }),
    ]
    assert.deepEqual(activeSentBetween(list, 'a', 'b', NOW).map(item => item.id), ['2', '1'])
    assert.deepEqual(activeSentBetween(list, 'b', 'a', NOW).map(item => item.id), ['4'])
})

test('the box is full at five, so the sixth message is refused', () => {
    assert.equal(quotaOf(4, LIMIT).isFull, false)
    assert.equal(quotaOf(4, LIMIT).remaining, 1)
    assert.equal(quotaOf(5, LIMIT).isFull, true)
    assert.equal(quotaOf(5, LIMIT).remaining, 0)
})

test('the countdown only exists once the message was heard', () => {
    assert.equal(remainingMs(null, NOW), null)
    assert.equal(remainingMs('2026-10-05T11:30:00Z', NOW), 5400000)
    assert.equal(remainingMs('2026-10-05T09:00:00Z', NOW), 0)
})

test('the countdown is split into hours and minutes, rounded up', () => {
    assert.deepEqual(remainingParts(5400000), { hours: 1, minutes: 30 })
    assert.deepEqual(remainingParts(59000), { hours: 0, minutes: 1 })
    assert.deepEqual(remainingParts(0), { hours: 0, minutes: 0 })
})
