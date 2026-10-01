import { getDb, one } from '../../utils/db'
import { logEvent } from '../../utils/log'
import { requirePermission } from '../../utils/permissions'
import { badRequest, notFound, requireParam } from '../../utils/validate'

export default defineEventHandler(async event => {
    const { familyId } = await requirePermission(event, 'members.manage')
    const id = requireParam(event, 'id')
    const db = getDb()
    const [target] = await db<{ id: string }[]>`
        select id from members where id = ${id} and family_id = ${familyId} and deleted_at is null
    `
    if (!target) {
        return notFound('Member not found')
    }
    const { count } = one(await db<{ count: number }[]>`
        select count(*)::int as count from members
        where family_id = ${familyId} and role = 'parent' and deleted_at is null and id <> ${id}
    `)
    if (count === 0) {
        return badRequest('At least one parent is required')
    }
    await db`update members set deleted_at = now() where id = ${id} and family_id = ${familyId} and deleted_at is null`
    await db`
        update messages set deleted_at = now()
        where family_id = ${familyId} and (from_member_id = ${id} or to_member_id = ${id}) and deleted_at is null
    `
    logEvent(`Profil archivé (soft delete) : ${id}`)
    return { ok: true }
})
