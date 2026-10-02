export type AiJobKind = 'photo_prefill' | 'book_generation' | 'translation' | 'image'
export type AiJobStatus = 'queued' | 'running' | 'succeeded' | 'failed'

export interface IAiStatus {
    enabled: boolean
    monthlyBudgetUsd: number
    defaultBudgetUsd: number
    isCustomBudget: boolean
    spentUsd: number
    remainingUsd: number
}

export interface IAiDraftCharacter {
    name: string
    color: VoiceColorId | null
    description: string
    isNarrator: boolean
}

export interface IAiDraftLine {
    pageIndex: number
    character: string
    text: string
    tone: string
    sceneDescription: string
}

export interface IAiDraftPage {
    imageDescription: string
    panels: string[]
}

export interface IAiBookDraft {
    title: string
    subtitle: string
    language: string
    style: string
    characters: IAiDraftCharacter[]
    pages: IAiDraftPage[]
    lines: IAiDraftLine[]
}

export interface IAiPhotoPrefillBody {
    fileIds: string[]
    language?: string
}

export interface IAiPhotoPrefillResult {
    jobId: string
    draft: IAiBookDraft
}

export interface IAiBookGenerationBody {
    idea: string
    language?: string
    pageCount?: number
    ageMin?: number | null
    ageMax?: number | null
}

export interface IAiBookGenerationResult {
    jobId: string
    bookId: string
    imagesGenerated: number
    imagesSkipped: number
    imagesBlocked: number
}

export interface IAiBudgetBody {
    monthlyBudgetUsd: number | null
}

export interface IAiTranslationLine {
    text: string
    tone?: string
}

export interface IAiTranslationBody {
    lines: IAiTranslationLine[]
    targetLanguage: string
    sourceLanguage?: string
}

export interface IAiTranslationSuggestion {
    text: string
    tone: string
}

export interface IAiTranslationResult {
    jobId: string
    suggestions: IAiTranslationSuggestion[]
}
