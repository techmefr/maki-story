export type ReviewAction = 'approve' | 'request_changes'
export type ReviewLineState = 'missing' | 'stale' | 'to_review' | 'changes' | 'approved'
export type ActivityKind = 'submitted' | 'resubmitted' | 'approved' | 'changes_requested' | 'validated' | 'stale' | 'voice_added'

export interface IReviewActionBody {
    action: ReviewAction
    comment?: string
    language?: string
}

export interface IReviewComment {
    id: string
    bookId: string
    lineId: string | null
    recordingId: string | null
    authorMemberId: string
    body: string
    createdAt: string
    resolvedAt: string | null
}

export interface IActivityItem {
    id: string
    kind: ActivityKind
    lineId: string | null
    actorMemberId: string | null
    subjectMemberId: string | null
    body: string
    count: number
    createdAt: string
    isNew: boolean
}

export interface IBookActivity {
    lastSeenAt: string | null
    newCount: number
    items: IActivityItem[]
}

export interface INewVoices {
    bookId: string
    memberIds: string[]
}

export interface ISubmitResult {
    submitted: number
}
