export interface ITimeRange {
    isEnabled: boolean
    from: string
    to: string
}

export interface IAccessControls {
    night: ITimeRange
    listening: ITimeRange
    homework: ITimeRange
    isApprovalEnabled: boolean
    timezone: string
}

export type TControlReason = 'night' | 'listening'

export interface IControlsVerdict {
    reason: TControlReason | null
    resumeAt: string | null
}
