const DAYS_IN_WEEK = 7
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const DEFAULT_WINDOW: IDayWindow = { isOpen: true, from: '08:00', to: '19:00' }

export const defaultWeekly = (): IDayWindow[] => Array.from({ length: DAYS_IN_WEEK }, () => ({ ...DEFAULT_WINDOW }))

export const isValidTimezone = (value: unknown): value is string => {
    if (typeof value !== 'string' || value === '' || value.length > 64) {
        return false
    }
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: value })
        return true
    } catch (_error) {
        return false
    }
}

export const toMinutes = (time: string): number => {
    const match = TIME_PATTERN.exec(time)
    return match ? Number(match[1]) * 60 + Number(match[2]) : -1
}

export const isValidWindow = (window: unknown): window is IDayWindow => {
    const candidate = window as Partial<IDayWindow> | null
    if (!candidate || typeof candidate.isOpen !== 'boolean' || typeof candidate.from !== 'string' || typeof candidate.to !== 'string') {
        return false
    }
    const from = toMinutes(candidate.from)
    const to = toMinutes(candidate.to)
    return from >= 0 && to >= 0 && from < to
}

export const isValidWeekly = (weekly: unknown): weekly is IDayWindow[] => {
    return Array.isArray(weekly) && weekly.length === DAYS_IN_WEEK && weekly.every(isValidWindow)
}

export interface ILocalParts {
    year: number
    month: number
    day: number
    weekday: number
    minutes: number
}

export const localParts = (instant: number, timezone: string): ILocalParts => {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hourCycle: 'h23',
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
    }).formatToParts(new Date(instant))
    const pick = (type: string): string => parts.find(part => part.type === type)?.value ?? ''
    return {
        year: Number(pick('year')),
        month: Number(pick('month')),
        day: Number(pick('day')),
        weekday: WEEKDAYS.indexOf(pick('weekday')),
        minutes: Number(pick('hour')) * 60 + Number(pick('minute')),
    }
}

const offsetAt = (instant: number, timezone: string): number => {
    const parts = localParts(instant, timezone)
    const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, 0, parts.minutes)
    return asUtc - Math.floor(instant / 60000) * 60000
}

export const zonedInstant = (year: number, month: number, day: number, minutes: number, timezone: string): number => {
    const guess = Date.UTC(year, month - 1, day, 0, minutes)
    const first = guess - offsetAt(guess, timezone)
    const second = guess - offsetAt(first, timezone)
    return second
}

const nextOpening = (schedule: IChildSchedule, now: number): number | null => {
    const today = localParts(now, schedule.timezone)
    for (let offset = 0; offset <= DAYS_IN_WEEK; offset++) {
        const window = schedule.weekly[(today.weekday + offset) % DAYS_IN_WEEK]
        if (!window?.isOpen) {
            continue
        }
        const from = toMinutes(window.from)
        if (offset === 0 && from <= today.minutes) {
            continue
        }
        const date = new Date(Date.UTC(today.year, today.month - 1, today.day + offset))
        return zonedInstant(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), from, schedule.timezone)
    }
    return null
}

const ALLOWED: IAccessStatus = { isAllowed: true, reason: null, resumeAt: null }

export const evaluateAccess = (schedule: IChildSchedule | null, now: number): IAccessStatus => {
    if (!schedule) {
        return ALLOWED
    }
    if (schedule.isManualBlock) {
        const until = schedule.manualUntil === null ? null : Date.parse(schedule.manualUntil)
        if (until === null || until > now) {
            return { isAllowed: false, reason: 'manual', resumeAt: schedule.manualUntil }
        }
    }
    if (!schedule.isEnabled) {
        return ALLOWED
    }
    const today = localParts(now, schedule.timezone)
    const window = schedule.weekly[today.weekday]
    if (window?.isOpen && today.minutes >= toMinutes(window.from) && today.minutes < toMinutes(window.to)) {
        return ALLOWED
    }
    const opening = nextOpening(schedule, now)
    return { isAllowed: false, reason: 'schedule', resumeAt: opening === null ? null : new Date(opening).toISOString() }
}


export const OVERRIDE_MINUTES = 30
