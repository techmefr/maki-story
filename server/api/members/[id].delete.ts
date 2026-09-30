import { getDb, one } from '../../utils/db'
import { logEvent } from '../../utils/log'
import { badRequest, requireParam } from '../../utils/validate'

export default defineEventHandler(async event => {
    const id = requireParam(event, 'id')
    const db = getDb()
    const { count } = one(await db<{ count: number }[]>`
        select count(*)::int as count from members where role = 'parent' and deleted_at is null and id <> ${id}
    `)
    if (count === 0) {
        return badRequest('At least one parent is required')
    }
    await db`update members set deleted_at = now() where id = ${id} and deleted_at is null`
    await db`update messages set deleted_at = now() where (from_member_id = ${id} or to_member_id = ${id}) and deleted_at is null`
    logEvent(`Profil archivé (soft delete) : ${id}`)
    return { ok: true }
})
