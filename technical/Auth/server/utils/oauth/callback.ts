import type { H3Event } from 'h3'
import { safeEqual, startSession } from '~~/technical/Auth/server/utils/session'
import { resolveSocialAccount } from '~~/technical/Auth/server/utils/oauth/accounts'
import { takeFlow } from '~~/technical/Auth/server/utils/oauth/flow'
import { OAuthError, verifyIdToken } from '~~/technical/Auth/server/utils/oauth/jwt'
import { getProviderConfig, redirectUriFor, requestOrigin } from '~~/technical/Auth/server/utils/oauth/providers'
import type { IProviderConfig } from '~~/technical/Auth/server/utils/oauth/providers'
import { isProviderAllowedForAccount } from '~~/server/utils/allowedProviders'
import { getDb } from '~~/server/utils/db'
import { logEvent } from '~~/server/utils/log'
import { assertIpBudget, recordIpHit } from '~~/technical/Auth/server/utils/throttle'
import { normalizeEmail } from '~~/server/utils/validate'

const FETCH_TIMEOUT_MS = 10_000
const DEFAULT_CALLBACKS_PER_WINDOW = 30

interface ICallbackParams {
    code?: string
    state?: string
    error?: string
    user?: string
}

const exchangeCode = async (config: IProviderConfig, redirectUri: string, code: string, verifier: string): Promise<string> => {
    const response = await fetch(config.tokenEndpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded', accept: 'application/json' },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: config.clientId,
            client_secret: config.clientSecret(),
            code_verifier: verifier,
        }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    if (!response.ok) {
        throw new OAuthError('oauth_failed')
    }
    const body = (await response.json()) as { id_token?: unknown }
    if (typeof body.id_token !== 'string') {
        throw new OAuthError('oauth_failed')
    }
    return body.id_token
}

const appleName = (raw: string | undefined): string => {
    try {
        const user = JSON.parse(raw ?? '{}') as { name?: { firstName?: string; lastName?: string } }
        return (user.name?.firstName ?? '').trim()
    } catch (_error) {
        return ''
    }
}

const finish = async (event: H3Event, provider: OAuthProviderId, params: ICallbackParams): Promise<void> => {
    const origin = requestOrigin(event)
    const config = getProviderConfig(provider, origin)
    const flow = takeFlow(event, provider)
    if (!config || !flow || typeof params.state !== 'string' || !safeEqual(params.state, flow.s)) {
        throw new OAuthError('oauth_state')
    }
    if (typeof params.error === 'string' || typeof params.code !== 'string' || params.code === '') {
        throw new OAuthError('oauth_denied')
    }
    const idToken = await exchangeCode(config, redirectUriFor(origin, provider), params.code, flow.v)
    const claims = await verifyIdToken(idToken, {
        jwksUri: config.jwksUri,
        issuers: config.issuers,
        audience: config.clientId,
        nonce: flow.n,
    })
    const displayName = (claims.given_name ?? claims.name ?? appleName(params.user)).trim().split(/\s+/)[0] ?? ''
    const session = await resolveSocialAccount({
        provider,
        subject: claims.sub,
        email: normalizeEmail(claims.email),
        isEmailVerified: claims.email_verified === true || claims.email_verified === 'true',
        displayName,
    })
    if (!(await isProviderAllowedForAccount(getDb(), session.accountId, provider))) {
        throw new OAuthError('oauth_denied')
    }
    startSession(event, session)
    logEvent('Connexion réussie')
}

export const handleOAuthCallback = async (event: H3Event, params: ICallbackParams): Promise<void> => {
    const provider = getRouterParam(event, 'provider')
    try {
        if (provider !== 'google' && provider !== 'apple') {
            throw new OAuthError('oauth_failed')
        }
        await assertIpBudget(event, 'oauth-callback', Number(process.env.OAUTH_IP_LIMIT) || DEFAULT_CALLBACKS_PER_WINDOW)
        await recordIpHit(event, 'oauth-callback')
        await finish(event, provider, params)
        await sendRedirect(event, '/profiles', 303)
    } catch (error) {
        const code: OAuthErrorCode = error instanceof OAuthError ? error.code : 'oauth_failed'
        if (!(error instanceof OAuthError)) {
            console.error('Echec de la connexion sociale', error)
        }
        logEvent(`Connexion sociale refusée : ${code}`)
        await sendRedirect(event, `/login?error=${code}`, 303)
    }
}
