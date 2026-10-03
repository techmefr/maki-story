import { getDb, one } from '~~/server/utils/db'
import { logEvent } from '~~/server/utils/log'
import { syncMembershipStatus } from '~~/server/utils/memberships'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { badRequest, notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async event => {
    const { familyId, memberId } = await requirePermission(event, 'members.manage')
    const id = requireParam(event, 'id')
    if (id === memberId) {
        return badRequest('You cannot remove your own profile')
    }
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
    await syncMembershipStatus(db, id, 'left')
    await db`
        update messages set deleted_at = now()
        where family_id = ${familyId} and (from_member_id = ${id} or to_member_id = ${id}) and deleted_at is null
    `
    logEvent(`Profil archivé (soft delete) : ${id}`)
    return { ok: true }
})
