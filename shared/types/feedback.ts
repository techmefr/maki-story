export type FeedbackMood = 'love' | 'ok' | 'bad'

export interface IFeedback {
    id: string
    memberName: string
    screen: string
    mood: FeedbackMood | null
    text: string
    createdAt: string
}

export interface INewFeedback {
    memberName: string
    screen: string
    mood: FeedbackMood | null
    text: string
}
