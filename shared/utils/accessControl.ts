import { isValidTimezone, localParts, toMinutes, zonedInstant } from './schedule.ts'

const MINUTES_PER_DAY = 1440

export const NIGHT_WARNING_MINUTES = 30
export const EXCEPTION_MINUTES = 60
export const SIGNIN_APPROVAL_HOURS = 12
export const REQUEST_EXPIRY_MINUTES = 10
export const MAX_REQUESTS_PER_SLOT = 2

export const defaultControls = (): IAccessControls => ({
    night: { isEnabled: false, from: '21:00', to: '07:00' },
    listening: { isEnabled: false, from: '08:00', to: '19:00' },
    homework: { isEnabled: false, from: '16:00', to: '19:00' },
    isApprovalEnabled: false,
    timezone: 'UTC',
})

const isValidRange = (range: unknown): range is ITimeRange => {
    const candidate = range as Partial<ITimeRange> | null
    if (!candidate || typeof candidate.isEnabled !== 'boolean' || typeof candidate.from !== 'string' || typeof candidate.to !== 'string') {
        return false
    }
    const from = toMinutes(candidate.from)
    const to = toMinutes(candidate.to)
    return from >= 0 && to >= 0 && from !== to
}

export const isValidControls = (value: unknown): value is IAccessControls => {
    const candidate = value as Partial<IAccessControls> | null
    return (
        !!candidate &&
        isValidRange(candidate.night) &&
        isValidRange(candidate.listening) &&
        isValidRange(candidate.homework) &&
        typeof candidate.isApprovalEnabled === 'boolean' &&
        isValidTimezone(candidate.timezone)
    )
}

export const isInRange = (minutes: number, range: ITimeRange): boolean => {
    const from = toMinutes(range.from)
    const to = toMinutes(range.to)
    return from < to ? minutes >= from && minutes < to : minutes >= from || minutes < to
}

const boundary = (now: number, timezone: string, time: string, direction: 'next' | 'last'): number => {
    const today = localParts(now, timezone)
    const minutes = toMinutes(time)
    const at = (offset: number): number => zonedInstant(today.year, today.month, today.day + offset, minutes, timezone)
    if (direction === 'next') {
        return at(0) > now ? at(0) : at(1)
    }
    return at(0) <= now ? at(0) : at(-1)
}

const nowMinutes = (now: number, timezone: string): number => localParts(now, timezone).minutes % MINUTES_PER_DAY

export const evaluateControls = (controls: IAccessControls | null, now: number): IControlsVerdict => {
    if (!controls) {
        return { reason: null, resumeAt: null }
    }
    const minutes = nowMinutes(now, controls.timezone)
    if (controls.night.isEnabled && isInRange(minutes, controls.night)) {
        return { reason: 'night', resumeAt: new Date(boundary(now, controls.timezone, controls.night.to, 'next')).toISOString() }
    }
    if (controls.listening.isEnabled && !isInRange(minutes, controls.listening)) {
        return { reason: 'listening', resumeAt: new Date(boundary(now, controls.timezone, controls.listening.from, 'next')).toISOString() }
    }
    return { reason: null, resumeAt: null }
}

export const isHomeworkHour = (controls: IAccessControls | null, now: number): boolean => {
    if (!controls || !controls.homework.isEnabled) {
        return true
    }
    return isInRange(nowMinutes(now, controls.timezone), controls.homework)
}

export const nextNightStart = (controls: IAccessControls | null, now: number): string | null => {
    if (!controls || !controls.night.isEnabled || isInRange(nowMinutes(now, controls.timezone), controls.night)) {
        return null
    }
    return new Date(boundary(now, controls.timezone, controls.night.from, 'next')).toISOString()
}

export const slotStart = (kind: TAccessRequestKind, controls: IAccessControls | null, now: number, memberSince: number): number => {
    const timezone = controls?.timezone ?? 'UTC'
    if (kind === 'signin') {
        return memberSince
    }
    if (kind === 'exception' && controls) {
        const verdict = evaluateControls(controls, now)
        if (verdict.reason === 'night') {
            return boundary(now, timezone, controls.night.from, 'last')
        }
        if (verdict.reason === 'listening') {
            return boundary(now, timezone, controls.listening.to, 'last')
        }
    }
    if (kind === 'homework' && controls?.homework.isEnabled) {
        return boundary(now, timezone, controls.homework.from, 'last')
    }
    return boundary(now, timezone, '00:00', 'last')
}

export const requestKindForReason = (reason: TAccessReason | null): TAccessRequestKind | null => {
    if (reason === 'homework') {
        return 'homework'
    }
    if (reason === 'approval') {
        return 'signin'
    }
    return reason === 'night' || reason === 'listening' ? 'exception' : null
}
