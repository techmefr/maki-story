export type BookKind = 'multi' | 'solo'
export type BookStatus = 'draft' | 'to_record' | 'ready'

export interface IBookSummary {
    id: string
    title: string
    kind: BookKind
    soloMemberId: string | null
    status: BookStatus
    pageCount: number
    lineCount: number
    recordedCount: number
    memberIds: string[]
    createdAt: string
}

export interface ILine {
    id: string
    position: number
    pageIndex: number
    character: string
    text: string
    note: string
    memberId: string | null
    audioFileId: string | null
    audioMs: number
}

export interface IBookPage {
    id: string
    position: number
    fileId: string
}

export interface IBook extends IBookSummary {
    imageDesc: string
    pages: IBookPage[]
    lines: ILine[]
    tones: Record<string, string>
}

export interface INewLine {
    pageIndex: number
    character: string
    text: string
}

export interface INewBook {
    title: string
    kind: BookKind
    soloMemberId: string | null
    imageDesc: string
    pageFileIds: string[]
    lines: INewLine[]
}

export interface ILinePatch {
    id: string
    memberId?: string | null
    note?: string
}

export interface IBookPatch {
    title?: string
    imageDesc?: string
    status?: BookStatus
    tones?: Record<string, string>
    lines?: ILinePatch[]
}
