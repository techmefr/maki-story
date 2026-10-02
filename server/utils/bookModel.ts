import type { Sql } from 'postgres'
import { BOOK_MOODS, BOOK_THEMES, MAX_BOOK_MOODS, MAX_BOOK_THEMES, MAX_VOICE_LANGUAGES } from '../../shared/utils/bookMeta'
import { badRequest, isNonEmptyString, isVoiceColor } from './validate'

export const BOOK_TYPES: BookType[] = ['standard', 'comic', 'wordless', 'child-written']
export const PAGE_KINDS: PageKind[] = ['cover', 'content', 'empty']

const MAX_AGE = 18
const MAX_TEXT = 500
const LANGUAGE_PATTERN = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/

export const checkBookType = (value: unknown): BookType => {
    return BOOK_TYPES.includes(value as BookType) ? (value as BookType) : badRequest('Invalid book type')
}

export const checkPageKind = (value: unknown): PageKind => {
    return PAGE_KINDS.includes(value as PageKind) ? (value as PageKind) : badRequest('Invalid page kind')
}

export const checkLanguage = (value: unknown): string => {
    return typeof value === 'string' && LANGUAGE_PATTERN.test(value) ? value : badRequest('Invalid language')
}

export const checkVoiceLanguages = (value: unknown): string[] => {
    if (!Array.isArray(value) || value.length > MAX_VOICE_LANGUAGES) {
        return badRequest('Invalid voice languages')
    }
    return [...new Set(value.map(checkLanguage))]
}

const checkTags = (value: unknown, allowed: string[], max: number, label: string): string[] => {
    if (!Array.isArray(value) || value.length > max || !value.every(item => typeof item === 'string' && allowed.includes(item))) {
        return badRequest(`Invalid ${label}`)
    }
    return [...new Set(value as string[])]
}

export const checkMoods = (value: unknown): string[] => checkTags(value, BOOK_MOODS, MAX_BOOK_MOODS, 'moods')

export const checkThemes = (value: unknown): string[] => checkTags(value, BOOK_THEMES, MAX_BOOK_THEMES, 'themes')

export const checkAge = (value: unknown): number | null => {
    if (value === null || value === undefined) {
        return null
    }
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > MAX_AGE) {
        return badRequest('Invalid age')
    }
    return value
}

export const checkAgeRange = (min: number | null, max: number | null): void => {
    if (min !== null && max !== null && min > max) {
        badRequest('Invalid age range')
    }
}

export const checkText = (value: unknown, label: string): string => {
    if (value === undefined || value === null) {
        return ''
    }
    if (typeof value !== 'string' || value.length > MAX_TEXT) {
        return badRequest(`Invalid ${label}`)
    }
    return value.trim()
}

export const checkColor = (value: unknown): string | null => {
    if (value === null || value === undefined) {
        return null
    }
    return isVoiceColor(value) ? value : badRequest('Invalid color')
}

export const checkName = (value: unknown): string => {
    return isNonEmptyString(value) && value.length <= 80 ? value.trim() : badRequest('A character needs a name')
}

export const isNarratorName = (name: string): boolean => name.trim().toLowerCase() === 'narrateur'

export const assertBookOwned = async (db: Sql, bookId: string, familyId: string): Promise<void> => {
    const rows = await db`select 1 from books where id = ${bookId} and family_id = ${familyId} and deleted_at is null`
    if (rows.length === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Book not found' })
    }
}
