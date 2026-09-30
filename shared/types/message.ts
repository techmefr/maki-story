export interface IMessage {
    id: string
    fromMemberId: string
    toMemberId: string
    fileId: string
    mime: string
    durationMs: number
    listenedAt: string | null
    createdAt: string
}

export interface INewMessage {
    fromMemberId: string
    toMemberId: string
    fileId: string
    mime: string
    durationMs: number
}
