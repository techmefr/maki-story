export type MessageKind = 'NORMAL' | 'BIRTHDAY'
export type MessageStatus = 'ACTIVE' | 'EXPIRED' | 'DELETED'

export interface IMessage {
    id: string
    fromMemberId: string
    toMemberId: string
    fileId: string
    mime: string
    durationMs: number
    kind: MessageKind
    status: MessageStatus
    listenedAt: string | null
    firstListenedAt: string | null
    expiresAt: string | null
    createdAt: string
    isSaved: boolean
}

export interface INewMessage {
    fromMemberId?: string
    toMemberId: string
    fileId: string
    mime: string
    durationMs: number
    kind?: MessageKind
}

export interface IQuota {
    count: number
    limit: number
    remaining: number
    isFull: boolean
}

export interface IMessageRecipient {
    member: IMember
    quota: IQuota
}
