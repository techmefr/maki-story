import { createPrivateKey, createSign } from 'node:crypto'
import type { H3Event } from 'h3'
import { isOAuthFake, isProviderConfigured } from '~~/shared/utils/oauth'

export const FAKE_ISSUER = 'https://fake-oidc.tantara.test'

export interface IProviderConfig {
    id: OAuthProviderId
    clientId: string
    authorizationEndpoint: string
    tokenEndpoint: string
    jwksUri: string
    issuers: string[]
    scope: string
    usesFormPost: boolean
    clientSecret: () => string
}

const APPLE_SECRET_TTL_SECONDS = 300

const appleClientSecret = (): string => {
    const header = Buffer.from(JSON.stringify({ alg: 'ES256', kid: process.env.APPLE_KEY_ID })).toString('base64url')
    const now = Math.floor(Date.now() / 1000)
    const claims = Buffer.from(
        JSON.stringify({
            iss: process.env.APPLE_TEAM_ID,
            iat: now,
            exp: now + APPLE_SECRET_TTL_SECONDS,
            aud: 'https://appleid.apple.com',
            sub: process.env.APPLE_CLIENT_ID,
        }),
    ).toString('base64url')
    const key = createPrivateKey((process.env.APPLE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'))
    const signature = createSign('SHA256').update(`${header}.${claims}`).sign({ key, dsaEncoding: 'ieee-p1363' })
    return `${header}.${claims}.${signature.toString('base64url')}`
}

export const requestOrigin = (event: H3Event): string => {
    const configured = (process.env.OAUTH_REDIRECT_BASE ?? '').trim().replace(/\/$/, '')
    return configured !== '' ? configured : getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin
}

export const getProviderConfig = (id: string, origin: string): IProviderConfig | null => {
    if (!isProviderConfigured(process.env, id) || (id !== 'google' && id !== 'apple')) {
        return null
    }
    if (isOAuthFake(process.env)) {
        const clientId = (id === 'google' ? process.env.GOOGLE_CLIENT_ID : process.env.APPLE_CLIENT_ID) ?? ''
        return {
            id,
            clientId,
            authorizationEndpoint: `${origin}/api/auth/oauth/fake/authorize`,
            tokenEndpoint: `${origin}/api/auth/oauth/fake/token`,
            jwksUri: `${origin}/api/auth/oauth/fake/jwks`,
            issuers: [FAKE_ISSUER],
            scope: 'openid email profile',
            usesFormPost: id === 'apple',
            clientSecret: () => 'fake-secret',
        }
    }
    if (id === 'google') {
        return {
            id,
            clientId: process.env.GOOGLE_CLIENT_ID ?? '',
            authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenEndpoint: 'https://oauth2.googleapis.com/token',
            jwksUri: 'https://www.googleapis.com/oauth2/v3/certs',
            issuers: ['https://accounts.google.com', 'accounts.google.com'],
            scope: 'openid email profile',
            usesFormPost: false,
            clientSecret: () => process.env.GOOGLE_CLIENT_SECRET ?? '',
        }
    }
    return {
        id,
        clientId: process.env.APPLE_CLIENT_ID ?? '',
        authorizationEndpoint: 'https://appleid.apple.com/auth/authorize',
        tokenEndpoint: 'https://appleid.apple.com/auth/token',
        jwksUri: 'https://appleid.apple.com/auth/keys',
        issuers: ['https://appleid.apple.com'],
        scope: 'name email',
        usesFormPost: true,
        clientSecret: appleClientSecret,
    }
}

export const redirectUriFor = (origin: string, id: string): string => `${origin}/api/auth/oauth/${id}/callback`
