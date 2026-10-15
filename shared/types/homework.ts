export type THomeworkDecision = 'approved' | 'refused'

export type THomeworkGate = 'none' | 'pending' | 'refused' | 'expired'

export type TAccessRequestKind = 'homework' | 'signin' | 'exception'

export interface IHomeworkRequest {
    id: string
    childId: string
    childName: string
    kind: TAccessRequestKind
    createdAt: string
    expiresAt: string
}

export interface IHomeworkFollow {
    isEnabled: boolean
}

export interface IHomeworkDecisionInput {
    decision: THomeworkDecision
}

export interface IHomeworkReply {
    status: THomeworkGate | THomeworkDecision
    message: string
}

export interface IHomeworkRequestList {
    items: IHomeworkRequest[]
}
