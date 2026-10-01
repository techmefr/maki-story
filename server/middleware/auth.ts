import { ensureSchema } from '../utils/db'
import { isSessionCurrent, readSession } from '../utils/session'

const PUBLIC_API_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/me', '/api/auth/logout']
const PUBLIC_OAUTH_PREFIX = '/api/auth/oauth/'
const SCHEMA_FREE_PATHS = ['/api/auth/me', '/api/auth/logout']

export default defineEventHandler(async event => {
    const path = event.path.split('?')[0] ?? ''
    if (!path.startsWith('/api/')) {
        return
    }
    if (!SCHEMA_FREE_PATHS.includes(path)) {
        await ensureSchema()
    }
    if (PUBLIC_API_PATHS.includes(path) || path.startsWith(PUBLIC_OAUTH_PREFIX)) {
        return
    }
    const session = readSession(event)
    if (!session || !(await isSessionCurrent(session))) {
        throw createError({ statusCode: 401, statusMessage: 'Not signed in' })
    }
})
