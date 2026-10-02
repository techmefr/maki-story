export type MembershipStatus = 'ACTIVE' | 'LEFT' | 'DECEASED' | 'BLOCKED'
export type InvitationChannel = 'WHATSAPP' | 'SMS' | 'EMAIL' | 'LINK'
export type PushPlatform = 'WEB' | 'IOS' | 'ANDROID'
export type NotificationChannel = 'IN_APP' | 'PUSH' | 'EMAIL'

export interface IMembership {
    familyId: string
    familyName: string
    memberId: string | null
    role: 'parent' | 'relative'
    status: MembershipStatus
}

export interface IRelativeChild {
    id: string
    name: string
    color: VoiceColorId
    photoFileId: string | null
}

export interface IRelativeRequest {
    kind: 'share' | 'line'
    bookId: string
    bookTitle: string
    lineCount: number
    shareId: string | null
}

export interface IRelativeProposal {
    shareId: string
    bookTitle: string
    status: ShareStatus
}

export interface IRelativeFamily {
    familyId: string
    familyName: string
    memberId: string
    children: IRelativeChild[]
    requests: IRelativeRequest[]
    proposals: IRelativeProposal[]
}

export interface IRelativeFlow {
    families: IRelativeFamily[]
    currentFamilyId: string
}

export interface IAccountOverview {
    isRelativeAccount: boolean
    memberships: IMembership[]
}

export interface IInvitationInput {
    channel: InvitationChannel
    contact?: string
    name?: string
    childIds?: string[]
    memberId?: string
    expiresInHours?: number
}

export interface IInvitation {
    id: string
    code: string
    channel: InvitationChannel
    contact: string
    name: string
    childIds: string[]
    expiresAt: string
    usedAt: string | null
    revokedAt: string | null
    createdAt: string
}

export interface IInvitationCreated extends IInvitation {
    link: string
    shareText: string
    isEmailSent: boolean
}

export interface IInvitationPreview {
    familyName: string
    inviterName: string
    isUsable: boolean
}

export interface IInvitationRedeem {
    code: string
    name?: string
    email?: string
    password?: string
}

export interface IPushSubscriptionInput {
    platform: PushPlatform
    endpoint: string
    keys?: Record<string, string>
}

export interface INotificationPreference {
    kind: NotificationKind
    channel: NotificationChannel
    isEnabled: boolean
}

export interface IPushConfig {
    webPublicKey: string
    isWebEnabled: boolean
}
