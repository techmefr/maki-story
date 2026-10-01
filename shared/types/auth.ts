export interface IAuthState {
    isSignedIn: boolean
    memberId: string | null
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
}
