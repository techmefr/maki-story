import { ensureSchema, getDb } from '../utils/db'
import { accessForMember } from '../utils/parental'
import { isSessionCurrent, readSession } from '~~/technical/Auth/server/utils/session'

const PUBLIC_API_PATHS = ['/api/auth/login', '/api/auth/register', '/api/auth/me', '/api/auth/logout', '/api/invitations/redeem']
const PUBLIC_PREFIXES = ['/api/auth/oauth/', '/api/invitations/preview/']

const SCHEMA_FREE_PATHS = ['/api/auth/me', '/api/auth/logout']
const ACCESS_EXEMPT_PREFIXES = ['/api/auth/', '/api/access']
const ACCESS_EXEMPT_READS = ['/api/members']

export default defineEventHandler(async event => {
    const path = event.path.split('?')[0] ?? ''
    if (!path.startsWith('/api/')) {
        return
    }
    if (!SCHEMA_FREE_PATHS.includes(path)) {
        await ensureSchema()
    }
    if (PUBLIC_API_PATHS.includes(path) || PUBLIC_PREFIXES.some(prefix => path.startsWith(prefix))) {
        return
    }
    const session = readSession(event)
    if (!session || !(await isSessionCurrent(session))) {
        throw createError({ statusCode: 401, statusMessage: 'Not signed in' })
    }
    if (!session.memberId || ACCESS_EXEMPT_PREFIXES.some(prefix => path.startsWith(prefix))) {
        return
    }
    if (event.method === 'GET' && ACCESS_EXEMPT_READS.includes(path)) {
        return
    }
    const access = await accessForMember(getDb(), session.familyId, session.memberId)
    if (!access.isAllowed) {
        throw createError({ statusCode: 403, statusMessage: 'Outside allowed hours', data: { code: 'outside-hours' } })
    }
})
