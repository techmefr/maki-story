export type MemberRole = 'parent' | 'relative' | 'child'

export interface IMember {
    id: string
    name: string
    role: MemberRole
    color: VoiceColorId
    photoFileId: string | null
}

export interface IMemberInput {
    name: string
    role: MemberRole
    color: VoiceColorId
}
