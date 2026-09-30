import { ensureSchema } from '../utils/db'
import { hasSession } from '../utils/session'

const PUBLIC_API_PATHS = ['/api/auth/login', '/api/auth/me']

export default defineEventHandler(async event => {
    const path = event.path.split('?')[0] ?? ''
    if (!path.startsWith('/api/') || PUBLIC_API_PATHS.includes(path)) {
        return
    }
    if (!hasSession(event)) {
        throw createError({ statusCode: 401, statusMessage: 'Not signed in' })
    }
    await ensureSchema()
})
