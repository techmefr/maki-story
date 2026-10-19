import assert from 'node:assert/strict'
import { test } from 'node:test'
import { evaluateAccess, isValidWindow } from '../../shared/utils/schedule.ts'

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

test('accepts overnight half-hour windows and rejects empty or irregular windows', () => {
    assert.equal(isValidWindow({ isOpen: true, from: '22:00', to: '02:30' }), true)
    assert.equal(isValidWindow({ isOpen: true, from: '08:00', to: '08:00' }), false)
    assert.equal(isValidWindow({ isOpen: true, from: '08:15', to: '19:00' }), false)
})

test('an overnight window belongs to its starting day, including Sunday rollover', () => {
    const weekly = Array.from({ length: 7 }, () => ({ isOpen: false, from: '08:00', to: '19:00' }))
    weekly[0] = { isOpen: true, from: '22:00', to: '02:30' }
    const overnight = { ...schedule, weekly }
    assert.equal(evaluateAccess(overnight, Date.parse('2026-10-04T21:59:00Z')).isAllowed, false)
    assert.equal(evaluateAccess(overnight, Date.parse('2026-10-04T22:00:00Z')).isAllowed, true)
    assert.equal(evaluateAccess(overnight, Date.parse('2026-10-05T02:29:00Z')).isAllowed, true)
    const closed = evaluateAccess(overnight, Date.parse('2026-10-05T02:30:00Z'))
    assert.equal(closed.isAllowed, false)
    assert.equal(closed.resumeAt, '2026-10-11T22:00:00.000Z')
})

test('overnight windows preserve the rule timezone and manual blocking', () => {
    const overnight = { ...schedule, timezone: 'Europe/Paris', weekly: schedule.weekly.map(() => ({ isOpen: true, from: '22:00', to: '02:30' })) }
    const instant = Date.parse('2026-10-05T00:00:00Z')
    assert.equal(evaluateAccess(overnight, instant).isAllowed, true)
    assert.equal(evaluateAccess({ ...overnight, isManualBlock: true }, instant).isAllowed, false)
})
