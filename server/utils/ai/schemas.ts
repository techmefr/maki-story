import { isVoiceColor } from '../validate'

export const MAX_AI_PAGES = 12
export const MAX_AI_LINES = 200
export const MAX_AI_CHARACTERS = 20
export const MAX_AI_PANELS = 6
export const MAX_AI_TRANSLATION_LINES = 100
const MAX_TEXT = 500
const MAX_TITLE = 120
const MAX_STYLE = 200

type TRecord = Record<string, unknown>

const fail = (message: string): never => {
    throw new Error(message)
}

const asRecord = (value: unknown, label: string): TRecord => {
    return typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as TRecord) : fail(`${label} must be an object`)
}

const asArray = (value: unknown, label: string, max: number): unknown[] => {
    if (!Array.isArray(value) || value.length > max) {
        return fail(`${label} must be an array of at most ${max} items`)
    }
    return value
}

const asText = (value: unknown, label: string, max = MAX_TEXT, required = false): string => {
    if (value === undefined || value === null) {
        return required ? fail(`${label} is required`) : ''
    }
    if (typeof value !== 'string' || value.length > max) {
        return fail(`${label} must be a string of at most ${max} characters`)
    }
    const trimmed = value.trim()
    return required && trimmed === '' ? fail(`${label} is required`) : trimmed
}

const asInteger = (value: unknown, label: string, min: number, max: number): number => {
    return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max ? value : fail(`${label} is out of range`)
}

const parseCharacter = (value: unknown): IAiDraftCharacter => {
    const record = asRecord(value, 'character')
    const name = asText(record.name, 'character name', 80, true)
    return {
        name,
        color: record.isNarrator !== true && isVoiceColor(record.color) ? record.color : null,
        description: asText(record.description, 'character description'),
        isNarrator: record.isNarrator === true,
    }
}

const parsePage = (value: unknown): IAiDraftPage => {
    const record = asRecord(value, 'page')
    return {
        imageDescription: asText(record.imageDescription, 'image description'),
        panels: asArray(record.panels ?? [], 'panels', MAX_AI_PANELS).map(panel => asText(panel, 'panel', MAX_TEXT, true)),
    }
}

const parseLine = (value: unknown, pageCount: number): IAiDraftLine => {
    const record = asRecord(value, 'line')
    return {
        pageIndex: asInteger(record.pageIndex, 'page index', 0, Math.max(pageCount - 1, 0)),
        character: asText(record.character, 'line character', 80),
        text: asText(record.text, 'line text', MAX_TEXT, true),
        tone: asText(record.tone, 'line tone', 120),
        sceneDescription: asText(record.sceneDescription, 'scene description'),
    }
}

export const parseBookDraft = (value: unknown, fallbackLanguage: string): IAiBookDraft => {
    const record = asRecord(value, 'draft')
    const characters = asArray(record.characters, 'characters', MAX_AI_CHARACTERS).map(parseCharacter)
    const pages = asArray(record.pages, 'pages', MAX_AI_PAGES).map(parsePage)
    const lines = asArray(record.lines, 'lines', MAX_AI_LINES).map(line => parseLine(line, pages.length))
    if (lines.length === 0) {
        fail('lines must not be empty')
    }
    if (new Set(characters.map(character => character.name.toLowerCase())).size !== characters.length) {
        fail('character names must be unique')
    }
    if (characters.filter(character => character.isNarrator).length > 1) {
        fail('only one narrator is allowed')
    }
    return {
        title: asText(record.title, 'title', MAX_TITLE, true),
        subtitle: asText(record.subtitle, 'subtitle', MAX_TITLE),
        language: fallbackLanguage,
        style: asText(record.style, 'style', MAX_STYLE),
        characters,
        pages,
        lines,
    }
}

export const parseTranslations = (value: unknown, expected: number): IAiTranslationSuggestion[] => {
    const suggestions = asArray(asRecord(value, 'answer').suggestions, 'suggestions', MAX_AI_TRANSLATION_LINES)
    if (suggestions.length !== expected) {
        fail('suggestions must match the number of lines')
    }
    return suggestions.map(item => {
        const record = asRecord(item, 'suggestion')
        return { text: asText(record.text, 'suggestion text', MAX_TEXT, true), tone: asText(record.tone, 'suggestion tone', 120) }
    })
}
