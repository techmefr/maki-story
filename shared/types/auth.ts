export interface IAuthState {
    isSignedIn: boolean
    memberId: string | null
    isRelativeAccount?: boolean
}

export interface ILoginInput {
    email: string
    password: string
}

export interface IRegisterInput {
    email: string
    password: string
    familyName: string
    parentName: string
    locale?: string
}

export interface IPasswordChangeInput {
    currentPassword: string
    newPassword: string
}
