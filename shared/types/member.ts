export type MemberRole = 'parent' | 'relative' | 'child'
export type MemberStatus = 'active' | 'invited' | 'left' | 'deceased' | 'blocked'
export type MemberCodeKind = 'pin' | 'symbols'
export type SymbolShape = 'star' | 'circle' | 'heart' | 'square' | 'triangle' | 'diamond'

export interface ISymbol {
    id: number
    shape: SymbolShape
    fill: string
}

export interface IMember {
    id: string
    name: string
    role: MemberRole
    color: VoiceColorId
    photoFileId: string | null
    status: MemberStatus
    hasCode: boolean
    codeKind: MemberCodeKind | null
    spokenLanguages: string[]
    appLocale: string | null
    voicePolicy: VoicePolicy
    isGuest: boolean
    isCodeLocked?: boolean
    codeEnabled?: boolean
    birthDate?: string | null
    ageYears?: number | null
    birthdayInDays?: number | null
    birthdayCelebratedYear?: number | null
    ageShift?: number
}

export interface IMemberCodeInput {
    kind: MemberCodeKind
    value: string
}

export interface IMemberInput {
    name: string
    role: MemberRole
    color: VoiceColorId
    code?: IMemberCodeInput
    birthDate?: string | null
    codeEnabled?: boolean
}

export interface IProfileProof {
    code?: string
    newCode?: IMemberCodeInput
    device?: IDeviceProof
}

export interface IMemberCodeUpdate extends IMemberCodeInput {
    currentCode?: string
}

export interface IMemberSettingsInput {
    name?: string
    photoFileId?: string | null
    spokenLanguages?: string[]
    appLocale?: string | null
}

export interface IProfileAccount {
    email: string
    hasGoogle: boolean
}
