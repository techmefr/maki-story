import { assertFakeEnabled, defaultFakeClaims, issueFakeCode } from '~~/technical/Auth/server/utils/oauth/fake'
import type { IFakeClaims } from '~~/technical/Auth/server/utils/oauth/fake'

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, char => `&#${char.charCodeAt(0)};`)

export default defineEventHandler(async event => {
    assertFakeEnabled()
    const query = getQuery(event)
    const read = (key: string): string => (typeof query[key] === 'string' ? (query[key] as string) : '')
    let claims = defaultFakeClaims()
    if (read('fake') !== '') {
        claims = { ...claims, ...(JSON.parse(read('fake')) as Partial<IFakeClaims>) }
    }
    const code = issueFakeCode({
        claims,
        nonce: read('nonce'),
        challenge: read('code_challenge'),
        redirectUri: read('redirect_uri'),
        clientId: read('client_id'),
    })
    const state = claims.state ?? read('state')
    if (read('response_mode') === 'form_post') {
        const fields = { code, state, ...(claims.user ? { user: claims.user } : {}) }
        const inputs = Object.entries(fields)
            .map(([name, value]) => `<input type="hidden" name="${name}" value="${escapeHtml(value)}">`)
            .join('')
        setResponseHeader(event, 'content-type', 'text/html; charset=utf-8')
        return `<!doctype html><html><body><form id="f" method="post" action="${escapeHtml(read('redirect_uri'))}">${inputs}</form><script>document.getElementById('f').submit()</script></body></html>`
    }
    const target = new URL(read('redirect_uri'))
    target.searchParams.set('code', code)
    target.searchParams.set('state', state)
    return sendRedirect(event, target.toString(), 302)
})
