import { ensureSchema } from '../utils/db'
import { readSession } from '../utils/session'

const PUBLIC_API_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/me', '/api/auth/logout']
const SCHEMA_FREE_PATHS = ['/api/auth/me', '/api/auth/logout']

export default defineEventHandler(async event => {
    const path = event.path.split('?')[0] ?? ''
    if (!path.startsWith('/api/')) {
        return
    }
    if (!SCHEMA_FREE_PATHS.includes(path)) {
        await ensureSchema()
    }
    if (PUBLIC_API_PATHS.includes(path)) {
        return
    }
    if (!readSession(event)) {
        throw createError({ statusCode: 401, statusMessage: 'Not signed in' })
    }
})
