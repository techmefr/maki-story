export type THomeworkDecision = 'approved' | 'refused'

export type THomeworkGate = 'none' | 'pending' | 'refused'

export interface IHomeworkRequest {
    id: string
    childId: string
    childName: string
    createdAt: string
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
