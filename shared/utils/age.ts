export const AGE_TAGS: IAgeTag[] = [
    { id: '0-3', min: 0, max: 3 },
    { id: '4-6', min: 4, max: 6 },
    { id: '7-9', min: 7, max: 9 },
    { id: '10+', min: 10, max: 99 },
]

export const ageTagOf = (ageMin: number | null, ageMax: number | null): IAgeTag | null => {
    if (ageMin === null) {
        return null
    }
    const high = ageMax ?? ageMin
    return AGE_TAGS.find(tag => ageMin <= tag.max && high >= tag.min) ?? null
}

export const BIRTHDAY_WISH_WINDOW_DAYS = 7

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const DAYS_PER_YEAR_FALLBACK = 366

export const todayIn = (timeZone: string, now: Date = new Date()): string => {
    try {
        return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
    } catch {
        return now.toISOString().slice(0, 10)
    }
}

export const isValidBirthDate = (value: unknown, now: Date = new Date()): value is string => {
    if (typeof value !== 'string') {
        return false
    }
    const match = DATE_PATTERN.exec(value)
    if (!match) {
        return false
    }
    const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
    return date.toISOString().slice(0, 10) === value && value <= now.toISOString().slice(0, 10) && Number(match[1]) >= now.getUTCFullYear() - 30
}

const isLeapYear = (year: number): boolean => (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0

const birthdayIn = (birthDate: string, year: number): string => {
    const month = birthDate.slice(5, 7)
    const day = birthDate.slice(8, 10)
    return month === '02' && day === '29' && !isLeapYear(year) ? `${year}-02-28` : `${year}-${month}-${day}`
}

export const computeAge = (birthDate: string, timeZone: string, now: Date = new Date()): number => {
    const today = todayIn(timeZone, now)
    const year = Number(today.slice(0, 4))
    const years = year - Number(birthDate.slice(0, 4))
    return today < birthdayIn(birthDate, year) ? years - 1 : years
}

export const isBirthdayToday = (birthDate: string, timeZone: string, now: Date = new Date()): boolean => {
    const today = todayIn(timeZone, now)
    return today === birthdayIn(birthDate, Number(today.slice(0, 4))) && computeAge(birthDate, timeZone, now) > 0
}

export const daysUntilBirthday = (birthDate: string, timeZone: string, now: Date = new Date()): number => {
    const today = todayIn(timeZone, now)
    const year = Number(today.slice(0, 4))
    const next = today <= birthdayIn(birthDate, year) ? birthdayIn(birthDate, year) : birthdayIn(birthDate, year + 1)
    const diff = (Date.parse(next) - Date.parse(today)) / 86400000
    return Number.isFinite(diff) ? Math.round(diff) : DAYS_PER_YEAR_FALLBACK
}
