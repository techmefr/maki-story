import assert from 'node:assert/strict'
import { test } from 'node:test'
import { evaluateAccess } from '../../shared/utils/schedule.ts'
import { LOCK_PRESETS, ruleToWeekly, stepMinutes, weeklyToRule } from '../../shared/utils/lockRule.ts'
import type { ILockRule } from '../../shared/utils/lockRule.ts'

const rule: ILockRule = { isEnabled: true, days: LOCK_PRESETS.week, from: 20 * 60, to: 7 * 60 }

const scheduleOf = (value: ILockRule): IChildSchedule => ({ isEnabled: value.isEnabled, weekly: ruleToWeekly(value), timezone: 'UTC', isManualBlock: false, manualUntil: null })

const allowed = (value: ILockRule, iso: string): boolean => evaluateAccess(scheduleOf(value), Date.parse(iso)).isAllowed

test('a locked evening starts at the chosen hour', () => {
    assert.equal(allowed(rule, '2026-10-05T19:00:00Z'), true)
    assert.equal(allowed(rule, '2026-10-05T20:30:00Z'), false)
})

test('the lock runs past midnight into the next morning', () => {
    assert.equal(allowed(rule, '2026-10-06T06:30:00Z'), false)
    assert.equal(allowed(rule, '2026-10-06T07:30:00Z'), true)
})

test('friday night locks until saturday morning but saturday night stays free', () => {
    assert.equal(allowed(rule, '2026-10-09T21:00:00Z'), false)
    assert.equal(allowed(rule, '2026-10-10T06:00:00Z'), false)
    assert.equal(allowed(rule, '2026-10-10T21:00:00Z'), true)
    assert.equal(allowed(rule, '2026-10-11T06:00:00Z'), true)
})

test('a rule survives the round trip through the weekly windows', () => {
    const back = weeklyToRule(scheduleOf(rule))
    assert.deepEqual(back, rule)
})

test('steps move by half hours and wrap around midnight', () => {
    assert.equal(stepMinutes(23 * 60 + 30, 1), 0)
    assert.equal(stepMinutes(0, -1), 23 * 60 + 30)
})
