export interface IAccountInfo {
    email: string
    termsVersion: string | null
    termsAcceptedAt: string | null
    canManageFamily: boolean
}

export interface IExportRequested {
    ok: boolean
    isEmailSent: boolean
    link?: string
}

export interface IConsentInput {
    version: string
}
