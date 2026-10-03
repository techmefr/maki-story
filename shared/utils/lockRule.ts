const STEP_MINUTES = 30
const MINUTES_PER_DAY = 1440
const LAST_MINUTE = '23:59'
const FIRST_MINUTE = '00:00'
const DAYS_IN_WEEK = 7
const DEFAULT_FROM = 20 * 60
const DEFAULT_TO = 7 * 60

export interface ILockRule {
    isEnabled: boolean
    days: number[]
    from: number
    to: number
}

export const DEFAULT_LOCK_RULE: ILockRule = { isEnabled: false, days: [0, 1, 2, 3, 4], from: DEFAULT_FROM, to: DEFAULT_TO }

export const LOCK_PRESETS: Record<'week' | 'weekend' | 'all', number[]> = {
    week: [0, 1, 2, 3, 4],
    weekend: [5, 6],
    all: [0, 1, 2, 3, 4, 5, 6],
}

const toMondayFirst = (weekday: number): number => (weekday + DAYS_IN_WEEK - 1) % DAYS_IN_WEEK

export const formatMinutes = (minutes: number): string => {
    const wrapped = ((minutes % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY
    return `${String(Math.floor(wrapped / 60)).padStart(2, '0')}:${String(wrapped % 60).padStart(2, '0')}`
}

const parseMinutes = (time: string): number => {
    const [hours = 0, minutes = 0] = time.split(':').map(Number)
    return hours * 60 + minutes
}

export const stepMinutes = (minutes: number, direction: 1 | -1): number => {
    return (minutes + direction * STEP_MINUTES + MINUTES_PER_DAY) % MINUTES_PER_DAY
}

export const isOvernight = (rule: ILockRule): boolean => rule.to < rule.from

export const ruleToWeekly = (rule: ILockRule): IDayWindow[] => {
    const lockedDays = new Set(rule.days)
    return Array.from({ length: DAYS_IN_WEEK }, (_, weekday) => {
        const mondayFirst = toMondayFirst(weekday)
        const previous = (mondayFirst + DAYS_IN_WEEK - 1) % DAYS_IN_WEEK
        const startsLock = lockedDays.has(mondayFirst)
        const endsLock = lockedDays.has(previous)
        const from = endsLock ? formatMinutes(rule.to) : FIRST_MINUTE
        const to = startsLock ? formatMinutes(rule.from) : LAST_MINUTE
        const isOpen = parseMinutes(from) < parseMinutes(to)
        return { isOpen, from: isOpen ? from : '08:00', to: isOpen ? to : '19:00' }
    })
}

export const weeklyToRule = (schedule: IChildSchedule | null): ILockRule => {
    if (!schedule) {
        return { ...DEFAULT_LOCK_RULE, days: [...DEFAULT_LOCK_RULE.days] }
    }
    const days: number[] = []
    let from = DEFAULT_FROM
    let to = DEFAULT_TO
    schedule.weekly.forEach((window, weekday) => {
        if (!window.isOpen) {
            days.push(toMondayFirst(weekday))
            return
        }
        if (window.to !== LAST_MINUTE) {
            days.push(toMondayFirst(weekday))
            from = parseMinutes(window.to)
        }
        if (window.from !== FIRST_MINUTE) {
            to = parseMinutes(window.from)
        }
    })
    return { isEnabled: schedule.isEnabled, days: days.sort((a, b) => a - b), from, to }
}

