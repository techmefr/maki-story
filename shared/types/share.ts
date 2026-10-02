export type ShareMode = 'record' | 'copy'
export type ShareStatus = 'proposed' | 'awaiting_owner' | 'pending' | 'accepted' | 'declined' | 'revoked'
export type VoicePolicy = 'keep' | 'block' | 'rerecord'
export type NotificationKind =
    | 'share_received'
    | 'share_accepted'
    | 'share_declined'
    | 'share_to_approve'
    | 'share_approved'
    | 'voice_batch'
    | 'recording_batch'
    | 'review_result'
    | 'birthday_reminder'
    | 'recording_request'
    | 'book_proposed'
    | 'proposal_result'
    | 'message_received'
    | 'birthday_reminder'
    | 'stale_takes'

export interface IFamilyInvite {
    code: string
    isRevoked: boolean
}

export interface IShare {
    id: string
    bookId: string
    bookTitle: string
    mode: ShareMode
    status: ShareStatus
    ownerFamilyName: string
    targetFamilyName: string
    proposedByName: string | null
    recorderMemberId: string | null
    lineCount: number
    recordedCount: number
    message: string
    createdAt: string
}

export interface IShareLists {
    outgoing: IShare[]
    incoming: IShare[]
    approvals: IShare[]
}

export interface IShareInput {
    bookId: string
    code: string
    mode: ShareMode
    lineIds?: string[]
    message?: string
}

export interface IShareLine {
    id: string
    pageIndex: number
    character: string
    text: string
    note: string
    tone: string
    sceneDescription: string
    hasRecording: boolean
}

export interface IShareBook {
    shareId: string
    title: string
    language: string
    recordingLanguage: string
    lines: IShareLine[]
}

export interface INotification {
    id: string
    kind: NotificationKind
    payload: Record<string, string | number>
    count: number
    isRead: boolean
    createdAt: string
    updatedAt: string
}

export interface INotificationList {
    items: INotification[]
    unreadCount: number
}

export interface IVoiceBook {
    id: string
    title: string
    lineCount: number
}
