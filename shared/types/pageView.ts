export type PageViewMode = 'create' | 'record' | 'review'

export interface IScanRect {
    x: number
    y: number
    width: number
    height: number
}

export interface IPageViewLine {
    id: string
    text: string
    originalText: string | null
    tone: string
    memberId: string | null
}

export interface IPageViewCharacter {
    id: string
    name: string
    color: string | null
    isNarrator: boolean
    description: string
    readerId: string | null
    lines: IPageViewLine[]
}

export interface IPageView {
    fileId: string | null
    previewUrl: string
    description: string
    panelCount: number
    characters: IPageViewCharacter[]
}
