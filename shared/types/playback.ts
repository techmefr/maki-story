export interface IPlaybackProgress {
    pageIndex: number
    lineIndex: number
    positionMs: number
}

export type SleepChoiceId = '10' | '20' | '30' | 'page'

export interface ISleepChoice {
    id: SleepChoiceId
    minutes: number | null
    label: string
}

export interface ILanguageAvailability {
    code: string
    recordedCount: number
}

export interface ILanguageConfig {
    languages: string[]
    isLocked: boolean
    scope: 'book' | 'profile'
}

export interface IPlaybackStep {
    lineId: string
    pageIndex: number
    panelId: string | null
    language: string
    fileId: string
    durationMs: number
    memberId: string
    isFallback: boolean
}

export interface IPlaybackPlan {
    bookId: string
    bookLanguage: string
    languages: string[] | null
    available: ILanguageAvailability[]
    config: ILanguageConfig | null
    steps: IPlaybackStep[]
}

export interface ILanguageConfigBody {
    bookId: string | null
    languages: string[]
}

export interface ILanguageLockBody {
    bookId: string | null
    isLocked: boolean
    parentId?: string
    code?: string
}

export interface IPlanLine {
    id: string
    pageIndex: number
    panelId: string | null
}

export interface IPlanRecording {
    lineId: string
    language: string
    fileId: string
    durationMs: number
    memberId: string
    status: string
}
