export type OAuthProviderId = 'google' | 'apple'

export type OAuthErrorCode = 'oauth_state' | 'oauth_failed' | 'oauth_denied' | 'email_unverified'

export interface IOAuthProviders {
    providers: OAuthProviderId[]
    upcoming: string[]
}
