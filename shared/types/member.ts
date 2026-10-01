export type MemberRole = 'parent' | 'relative' | 'child'
export type MemberStatus = 'active' | 'invited' | 'left' | 'deceased' | 'blocked'

export interface IMember {
    id: string
    name: string
    role: MemberRole
    color: VoiceColorId
    photoFileId: string | null
    status: MemberStatus
}

export interface IMemberInput {
    name: string
    role: MemberRole
    color: VoiceColorId
}
