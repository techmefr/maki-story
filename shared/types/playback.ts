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
