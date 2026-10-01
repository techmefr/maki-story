import type { H3Event } from 'h3'

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']
const OAUTH_PREFIX = '/api/auth/oauth/'
const SAME_ORIGIN_SITES = ['same-origin', 'none']

const trustedOrigins = (): string[] => {
    return (process.env.TRUSTED_ORIGINS ?? '')
        .split(',')
        .map(origin => origin.trim())
        .filter(origin => origin !== '')
}

const isSameHost = (origin: string, event: H3Event): boolean => {
    try {
        return new URL(origin).host === getRequestHost(event, { xForwardedHost: true })
    } catch (_error) {
        return false
    }
}

const reject = (): never => {
    throw createError({ statusCode: 403, statusMessage: 'Cross-site request refused' })
}

export default defineEventHandler(event => {
    const path = event.path.split('?')[0] ?? ''
    if (!path.startsWith('/api/') || SAFE_METHODS.includes(event.method) || path.startsWith(OAUTH_PREFIX)) {
        return
    }
    const origin = getRequestHeader(event, 'origin')
    if (origin !== undefined && (trustedOrigins().includes(origin) || isSameHost(origin, event))) {
        return
    }
    const site = getRequestHeader(event, 'sec-fetch-site')
    if (origin === undefined && (site === undefined || SAME_ORIGIN_SITES.includes(site))) {
        return
    }
    reject()
})
