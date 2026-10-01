export type BookKind = 'multi' | 'solo'
export type BookStatus = 'draft' | 'to_record' | 'ready'
export type BookType = 'standard' | 'comic' | 'wordless' | 'child-written'
export type PageKind = 'cover' | 'content' | 'empty'
export type RecordingStatus = 'draft' | 'submitted' | 'approved' | 'changes_requested' | 'stale'

export interface IBookSummary {
    id: string
    title: string
    subtitle: string
    author: string
    ageMin: number | null
    ageMax: number | null
    language: string
    type: BookType
    ttsFallback: boolean
    kind: BookKind
    soloMemberId: string | null
    status: BookStatus
    aiGenerated: boolean
    pageCount: number
    lineCount: number
    recordedCount: number
    memberIds: string[]
    createdAt: string
}

export interface ICharacter {
    id: string
    name: string
    color: string | null
    description: string
    isNarrator: boolean
    position: number
}

export interface IPanel {
    id: string
    pageId: string
    position: number
    description: string
}

export interface ILine {
    id: string
    position: number
    pageIndex: number
    character: string
    characterId: string | null
    panelId: string | null
    text: string
    note: string
    tone: string
    sceneDescription: string
    memberId: string | null
    audioFileId: string | null
    audioMs: number
    recordingStatus: RecordingStatus | null
}

export interface ILineRecording {
    id: string
    lineId: string
    memberId: string
    language: string
    fileId: string
    durationMs: number
    mime: string
    status: RecordingStatus
    createdAt: string
}

export interface ILineTranslation {
    lineId: string
    language: string
    text: string
    tone: string
}

export interface ITranslationBody {
    text?: string
    tone?: string
}

export interface IBookPage {
    id: string
    position: number
    fileId: string | null
    kind: PageKind
    ttsFallback: boolean
    description: string
    panels: IPanel[]
}

export interface IBook extends IBookSummary {
    imageDesc: string
    pages: IBookPage[]
    characters: ICharacter[]
    lines: ILine[]
    recordings: ILineRecording[]
    translations: ILineTranslation[]
    tones: Record<string, string>
}

export interface INewCharacter {
    name: string
    color?: string | null
    description?: string
    isNarrator?: boolean
}

export interface INewPanel {
    description: string
}

export interface INewPage {
    fileId: string | null
    kind?: PageKind
    ttsFallback?: boolean
    description?: string
    panels?: INewPanel[]
}

export interface INewLine {
    pageIndex: number
    character: string
    text: string
    panelPosition?: number
    tone?: string
    sceneDescription?: string
}

export interface INewBook {
    title: string
    subtitle?: string
    author?: string
    ageMin?: number | null
    ageMax?: number | null
    language?: string
    type?: BookType
    ttsFallback?: boolean
    kind: BookKind
    soloMemberId: string | null
    imageDesc: string
    pageFileIds: string[]
    pages?: INewPage[]
    characters?: INewCharacter[]
    lines: INewLine[]
}

export interface ILinePatch {
    id: string
    memberId?: string | null
    note?: string
    text?: string
    tone?: string
    sceneDescription?: string
    characterId?: string | null
    panelId?: string | null
}

export interface IBookPatch {
    title?: string
    subtitle?: string
    author?: string
    ageMin?: number | null
    ageMax?: number | null
    language?: string
    type?: BookType
    ttsFallback?: boolean
    imageDesc?: string
    status?: BookStatus
    tones?: Record<string, string>
    lines?: ILinePatch[]
}

export interface ICharacterBody {
    name?: string
    color?: string | null
    description?: string
    isNarrator?: boolean
}

export interface IPagePatch {
    kind?: PageKind
    ttsFallback?: boolean
    description?: string
}

export interface IPanelBody {
    description?: string
    position?: number
}
