import { getDb } from '../../utils/db'
import { requireSession } from '../../utils/family'

const MAX_ENTRIES = 200

const adminEmails = (): string[] => (process.env.INSTANCE_ADMIN_EMAILS ?? '').split(',').map(email => email.trim().toLowerCase()).filter(email => email !== '')

export default defineEventHandler(async (event): Promise<IAdminLogEntry[]> => {
    const session = requireSession(event)
    const db = getDb()
    const [account] = await db<{ email: string }[]>`select email from accounts where id = ${session.accountId}`
    if (!account || !adminEmails().includes(account.email.toLowerCase())) {
        throw createError({ statusCode: 403, statusMessage: 'Your profile cannot do this' })
    }
    return db<IAdminLogEntry[]>`
        select source, route, method, status, message, count(*)::int as count, max(created_at) as last_seen_at
        from error_log
        group by source, route, method, status, message
        order by max(created_at) desc limit ${MAX_ENTRIES}
    `
})
