import { getDb } from '../../utils/db'
import { requireInstanceAdmin } from '../../utils/admin'

const MAX_ENTRIES = 200

export default defineEventHandler(async (event): Promise<IAdminLogEntry[]> => {
    await requireInstanceAdmin(event)
    return getDb()<IAdminLogEntry[]>`
        select source, route, method, status, message, count(*)::int as count, max(created_at) as last_seen_at
        from error_log
        group by source, route, method, status, message
        order by max(created_at) desc limit ${MAX_ENTRIES}
    `
})
