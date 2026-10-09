export type BookKind = 'multi' | 'solo'
export type BookStatus = 'proposed' | 'draft' | 'to_record' | 'in_review' | 'ready'
export type BookType = 'standard' | 'comic' | 'wordless' | 'child-written'
export type PageKind = 'cover' | 'content' | 'empty'
export type RecordingStatus = 'draft' | 'submitted' | 'approved' | 'changes_requested' | 'stale'

export interface IBookSummary {
    id: string
    title: string
    subtitle: string
    author: string
    illustrator: string
    ageMin: number | null
    ageMax: number | null
    childVisible: boolean | null
    translatedLanguages: string[]
    language: string
    writtenLanguage: string
    voiceLanguages: string[]
    moods: string[]
    themes: string[]
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
    readerIds: string[]
    coverFileId: string | null
    coverUrl: string | null
    submittedCount: number
    isVoiceBlocked: boolean
    blockedLineCount: number
    changesRequestedCount: number
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
    previousText: string | null
    note: string
    tone: string
    sceneDescription: string
    memberId: string | null
    audioFileId: string | null
    audioMs: number
    recordingStatus: RecordingStatus | null
    isVoiceBlocked: boolean
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
    title: string
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
    title?: string
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
    illustrator?: string
    ageMin?: number | null
    ageMax?: number | null
    language?: string
    writtenLanguage?: string
    voiceLanguages?: string[]
    moods?: string[]
    themes?: string[]
    type?: BookType
    ttsFallback?: boolean
    kind: BookKind
    soloMemberId: string | null
    isProposal?: boolean
    isbn?: string
    coverUrl?: string
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
    illustrator?: string
    ageMin?: number | null
    ageMax?: number | null
    childVisible?: boolean | null
    language?: string
    writtenLanguage?: string
    voiceLanguages?: string[]
    moods?: string[]
    themes?: string[]
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
    title?: string
    description?: string
}

export interface IPanelBody {
    description?: string
    position?: number
}

export interface IAgeTag {
    id: string
    min: number
    max: number
}

export interface IBookQuery {
    q?: string
    language?: string
    age?: string
    type?: string
    mood?: string
    theme?: string
    tag?: string
    status?: string
    limit?: number
    offset?: number
}

export interface IBookList {
    items: IBookSummary[]
    total: number
}

export type ProposalDecision = 'approve' | 'decline'

export interface IProposalBody {
    decision: ProposalDecision
}

export interface IBookAccess {
    isRestricted: boolean
    bookIds: string[]
}

export interface IIsbnBook {
    isbn: string
    title: string
    author: string
    subjects: string[]
    coverUrl: string | null
}

export interface IHomeCounts {
    proposals: number
    drafts: number
    toRecord: number
    inReview: number
    recorded: number
    trash: number
    proposedByMe: number
    requests: number
    proposalsWaiting: number
    toFix: number
}

export interface IPlanUsage {
    plan: 'free' | 'premium' | 'lifetime'
    limits: { books: number | null; adults: number | null }
    books: number
    adults: number
}
