import { challengeFor } from '../../../../utils/oauth/flow'
import { assertFakeEnabled, issueFakeIdToken, readFakeCode } from '../../../../utils/oauth/fake'

export default defineEventHandler(async event => {
    assertFakeEnabled()
    const body = ((await readBody(event)) ?? {}) as Record<string, unknown>
    const code = typeof body.code === 'string' ? readFakeCode(body.code) : null
    const verifier = typeof body.code_verifier === 'string' ? body.code_verifier : ''
    if (
        !code ||
        challengeFor(verifier) !== code.challenge ||
        body.redirect_uri !== code.redirectUri ||
        body.client_id !== code.clientId ||
        body.client_secret !== 'fake-secret'
    ) {
        throw createError({ statusCode: 400, statusMessage: 'invalid_grant' })
    }
    return { access_token: 'fake', token_type: 'Bearer', id_token: issueFakeIdToken(code) }
})
