import assert from 'node:assert/strict'
import { test } from 'node:test'
import { evaluateAccess } from '../../shared/utils/schedule.ts'

const window = { isOpen: true, from: '08:00', to: '19:00' }
const schedule = {
    isEnabled: true,
    weekly: Array.from({ length: 7 }, () => ({ ...window })),
    timezone: 'UTC',
    isManualBlock: false,
    manualUntil: null,
}

test('allows access inside the window', () => {
    assert.equal(evaluateAccess(schedule, Date.parse('2026-10-05T10:00:00Z')).isAllowed, true)
})

test('locks outside the window and gives the next opening', () => {
    const status = evaluateAccess(schedule, Date.parse('2026-10-05T20:00:00Z'))
    assert.equal(status.isAllowed, false)
    assert.equal(status.reason, 'schedule')
    assert.equal(status.resumeAt, '2026-10-06T08:00:00.000Z')
})

test('applies the schedule in the given timezone', () => {
    const paris = { ...schedule, timezone: 'Europe/Paris' }
    assert.equal(evaluateAccess(paris, Date.parse('2026-10-05T15:30:00Z')).isAllowed, true)
    assert.equal(evaluateAccess(paris, Date.parse('2026-10-05T17:30:00Z')).isAllowed, false)
})

test('a manual block wins over an open window', () => {
    const blocked = { ...schedule, isManualBlock: true }
    assert.equal(evaluateAccess(blocked, Date.parse('2026-10-05T10:00:00Z')).reason, 'manual')
})

test('no schedule means no limit', () => {
    assert.equal(evaluateAccess(null, Date.now()).isAllowed, true)
})
