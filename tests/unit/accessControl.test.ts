import assert from 'node:assert/strict'
import { test } from 'node:test'
import { defaultControls, evaluateControls, isHomeworkHour, isValidControls, nextNightStart, requestKindForReason, slotStart } from '../../shared/utils/accessControl.ts'

const controls = (patch: Record<string, unknown> = {}) => ({ ...defaultControls(), ...patch })
const night = { isEnabled: true, from: '21:00', to: '07:00' }
const at = (time: string): number => Date.parse(`2026-10-05T${time}:00Z`)

test('night mode wraps midnight and gives the morning resume time', () => {
    const settings = controls({ night })
    assert.equal(evaluateControls(settings, at('23:30')).reason, 'night')
    assert.equal(evaluateControls(settings, at('23:30')).resumeAt, '2026-10-06T07:00:00.000Z')
    assert.equal(evaluateControls(settings, at('03:00')).reason, 'night')
    assert.equal(evaluateControls(settings, at('03:00')).resumeAt, '2026-10-05T07:00:00.000Z')
    assert.equal(evaluateControls(settings, at('12:00')).reason, null)
})

test('listening range locks outside and resumes at its start', () => {
    const settings = controls({ listening: { isEnabled: true, from: '08:00', to: '19:00' } })
    assert.equal(evaluateControls(settings, at('10:00')).reason, null)
    assert.equal(evaluateControls(settings, at('19:00')).reason, 'listening')
    assert.equal(evaluateControls(settings, at('19:30')).resumeAt, '2026-10-06T08:00:00.000Z')
    assert.equal(evaluateControls(settings, at('06:00')).resumeAt, '2026-10-05T08:00:00.000Z')
})

test('disabled rules and a missing configuration never lock', () => {
    assert.equal(evaluateControls(null, at('03:00')).reason, null)
    assert.equal(evaluateControls(controls(), at('03:00')).reason, null)
})

test('rules follow their own timezone', () => {
    const settings = controls({ night, timezone: 'Indian/Antananarivo' })
    assert.equal(evaluateControls(settings, at('19:00')).reason, 'night')
    assert.equal(evaluateControls(settings, at('10:00')).reason, null)
})

test('the homework gate only applies inside the homework range when one is set', () => {
    const settings = controls({ homework: { isEnabled: true, from: '16:00', to: '19:00' } })
    assert.equal(isHomeworkHour(settings, at('17:00')), true)
    assert.equal(isHomeworkHour(settings, at('20:00')), false)
    assert.equal(isHomeworkHour(controls(), at('20:00')), true)
    assert.equal(isHomeworkHour(null, at('20:00')), true)
})

test('the night countdown starts from the next night start', () => {
    const settings = controls({ night })
    assert.equal(nextNightStart(settings, at('20:30')), '2026-10-05T21:00:00.000Z')
    assert.equal(nextNightStart(settings, at('22:00')), null)
    assert.equal(nextNightStart(controls(), at('20:30')), null)
})

test('a request slot starts when the blocked period began', () => {
    const settings = controls({ night })
    assert.equal(slotStart('exception', settings, at('23:30'), 0), at('21:00'))
    assert.equal(slotStart('exception', settings, at('03:00'), 0), Date.parse('2026-10-04T21:00:00Z'))
    assert.equal(slotStart('signin', settings, at('23:30'), 123), 123)
    assert.equal(slotStart('homework', controls(), at('23:30'), 0), at('00:00'))
})

test('a reason maps to the kind of request it allows', () => {
    assert.equal(requestKindForReason('homework'), 'homework')
    assert.equal(requestKindForReason('approval'), 'signin')
    assert.equal(requestKindForReason('night'), 'exception')
    assert.equal(requestKindForReason('listening'), 'exception')
    assert.equal(requestKindForReason('manual'), null)
    assert.equal(requestKindForReason(null), null)
})

test('validates ranges, timezone and flags', () => {
    assert.equal(isValidControls(defaultControls()), true)
    assert.equal(isValidControls(controls({ night: { isEnabled: true, from: '07:00', to: '07:00' } })), false)
    assert.equal(isValidControls(controls({ night: { isEnabled: true, from: '25:00', to: '07:00' } })), false)
    assert.equal(isValidControls(controls({ timezone: 'Nowhere/Land' })), false)
    assert.equal(isValidControls(controls({ isApprovalEnabled: 'yes' })), false)
    assert.equal(isValidControls(null), false)
})
