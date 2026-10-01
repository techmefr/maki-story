import { createPublicKey, createVerify } from 'node:crypto'
import type { JsonWebKeyInput } from 'node:crypto'

export class OAuthError extends Error {
    code: OAuthErrorCode

    constructor(code: OAuthErrorCode) {
        super(code)
        this.code = code
    }
}

export interface IIdTokenClaims {
    iss: string
    aud: string | string[]
    sub: string
    exp: number
    nonce?: string
    email?: string
    email_verified?: boolean | string
    name?: string
    given_name?: string
}

export interface IIdTokenExpectation {
    jwksUri: string
    issuers: string[]
    audience: string
    nonce: string
}

interface IJwksEntry {
    keys: (JsonWebKeyInput['key'] & { kid?: string })[]
    fetchedAt: number
}

const JWKS_TTL_MS = 60 * 60 * 1000
const FETCH_TIMEOUT_MS = 10_000
const jwksCache = new Map<string, IJwksEntry>()

const loadKeys = async (uri: string, isForced: boolean): Promise<IJwksEntry['keys']> => {
    const cached = jwksCache.get(uri)
    if (cached && !isForced && Date.now() - cached.fetchedAt < JWKS_TTL_MS) {
        return cached.keys
    }
    const response = await fetch(uri, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (!response.ok) {
        throw new OAuthError('oauth_failed')
    }
    const body = (await response.json()) as { keys?: IJwksEntry['keys'] }
    const keys = Array.isArray(body.keys) ? body.keys : []
    jwksCache.set(uri, { keys, fetchedAt: Date.now() })
    return keys
}

const decode = <T>(part: string): T => JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as T

export const verifyIdToken = async (token: string, expected: IIdTokenExpectation): Promise<IIdTokenClaims> => {
    const parts = token.split('.')
    if (parts.length !== 3) {
        throw new OAuthError('oauth_failed')
    }
    const [header, payload, signature] = parts as [string, string, string]
    try {
        const head = decode<{ alg?: string; kid?: string }>(header)
        if (head.alg !== 'RS256') {
            throw new OAuthError('oauth_failed')
        }
        let jwk = (await loadKeys(expected.jwksUri, false)).find(key => key.kid === head.kid)
        if (!jwk) {
            jwk = (await loadKeys(expected.jwksUri, true)).find(key => key.kid === head.kid)
        }
        if (!jwk) {
            throw new OAuthError('oauth_failed')
        }
        const isValid = createVerify('RSA-SHA256')
            .update(`${header}.${payload}`)
            .verify(createPublicKey({ key: jwk, format: 'jwk' }), Buffer.from(signature, 'base64url'))
        const claims = decode<IIdTokenClaims>(payload)
        const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
        if (
            !isValid ||
            !expected.issuers.includes(claims.iss) ||
            !audiences.includes(expected.audience) ||
            !(claims.exp * 1000 > Date.now()) ||
            claims.nonce !== expected.nonce ||
            typeof claims.sub !== 'string' ||
            claims.sub === ''
        ) {
            throw new OAuthError('oauth_failed')
        }
        return claims
    } catch (error) {
        throw error instanceof OAuthError ? error : new OAuthError('oauth_failed')
    }
}
