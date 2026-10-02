export type TOutboxKind = 'message' | 'recording'

export type TOutboxStatus = 'pending' | 'sending' | 'sent' | 'failed'

export interface IOutboxMessagePayload {
    fromMemberId: string
    toMemberId: string
}

export interface IOutboxRecordingPayload {
    bookId: string
    lineId: string
    language?: string
}

export interface IOutboxItem {
    id: string
    kind: TOutboxKind
    memberId: string
    label: string
    status: TOutboxStatus
    blob: Blob
    mime: string
    durationMs: number
    payload: IOutboxMessagePayload | IOutboxRecordingPayload
    uploadId: string | null
    fileId: string | null
    attempts: number
    nextAttemptAt: number
    errorStatus: number | null
    errorMessage: string | null
    createdAt: number
    sentAt: number | null
}
