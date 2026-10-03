import { isOAuthFake } from '~~/shared/utils/oauth'
import { beginFlow, challengeFor } from '~~/server/utils/oauth/flow'
import { getProviderConfig, redirectUriFor, requestOrigin } from '~~/server/utils/oauth/providers'

export default defineEventHandler(async event => {
    const provider = getRouterParam(event, 'provider') ?? ''
    const origin = requestOrigin(event)
    const config = getProviderConfig(provider, origin)
    if (!config) {
        throw createError({ statusCode: 404, statusMessage: 'Provider not available' })
    }
    const flow = beginFlow(event, config.id)
    const url = new URL(config.authorizationEndpoint)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', config.clientId)
    url.searchParams.set('redirect_uri', redirectUriFor(origin, config.id))
    url.searchParams.set('scope', config.scope)
    url.searchParams.set('state', flow.s)
    url.searchParams.set('nonce', flow.n)
    url.searchParams.set('code_challenge', challengeFor(flow.v))
    url.searchParams.set('code_challenge_method', 'S256')
    if (config.usesFormPost) {
        url.searchParams.set('response_mode', 'form_post')
    }
    const query = getQuery(event)
    if (isOAuthFake(process.env) && typeof query.fake === 'string') {
        url.searchParams.set('fake', query.fake)
    }
    await sendRedirect(event, url.toString(), 302)
})
