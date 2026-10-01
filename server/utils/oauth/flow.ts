import { createHash, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import { safeEqual, sign } from '../session'

export const OAUTH_COOKIE = 'tantara_oauth'
const FLOW_MAX_AGE_SECONDS = 600

export interface IOAuthFlow {
    p: OAuthProviderId
    s: string
    n: string
    v: string
    e: number
}

const random = (): string => randomBytes(32).toString('base64url')

export const challengeFor = (verifier: string): string => createHash('sha256').update(verifier).digest('base64url')

export const beginFlow = (event: H3Event, provider: OAuthProviderId): IOAuthFlow => {
    const flow: IOAuthFlow = { p: provider, s: random(), n: random(), v: random(), e: Date.now() + FLOW_MAX_AGE_SECONDS * 1000 }
    const encoded = Buffer.from(JSON.stringify(flow)).toString('base64url')
    setCookie(event, OAUTH_COOKIE, `${encoded}.${sign(encoded)}`, {
        httpOnly: true,
        secure: !import.meta.dev,
        sameSite: provider === 'apple' && !import.meta.dev ? 'none' : 'lax',
        maxAge: FLOW_MAX_AGE_SECONDS,
        path: '/api/auth/oauth',
    })
    return flow
}

export const takeFlow = (event: H3Event, provider: OAuthProviderId): IOAuthFlow | null => {
    const token = getCookie(event, OAUTH_COOKIE)
    deleteCookie(event, OAUTH_COOKIE, { path: '/api/auth/oauth' })
    const [encoded, signature] = (token ?? '').split('.')
    if (!encoded || !signature || !safeEqual(signature, sign(encoded))) {
        return null
    }
    try {
        const flow = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as IOAuthFlow
        return flow.p === provider && flow.e > Date.now() ? flow : null
    } catch (_error) {
        return null
    }
}
