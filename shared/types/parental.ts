export interface IDayWindow {
    isOpen: boolean
    from: string
    to: string
}

export interface IChildSchedule {
    isEnabled: boolean
    weekly: IDayWindow[]
    timezone: string
    isManualBlock: boolean
    manualUntil: string | null
}

export type TAccessReason = 'manual' | 'schedule'

export interface IAccessStatus {
    isAllowed: boolean
    reason: TAccessReason | null
    resumeAt: string | null
}

export interface IScheduleInput {
    isEnabled: boolean
    weekly: IDayWindow[]
    timezone: string
}

export type TAccessBlockMode = 'now' | 'until' | 'clear'

export interface IAccessBlockInput {
    mode: TAccessBlockMode
    until?: string
}
