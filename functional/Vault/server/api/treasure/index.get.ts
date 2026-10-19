import { canAccessVault } from '~~/shared/utils/vaultAccess'
import { TREASURE_LIMIT } from '~~/shared/utils/voices'
import { getDb } from '~~/server/utils/db'
import { assertMembersInFamily } from '~~/server/utils/family'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { badRequest } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<ITreasureBox> => {
    const actor = await requirePermission(event, 'treasure.list')
    const requested = getQuery(event).childId
    const ownsOnly = actor.role !== 'parent'
    const childId = ownsOnly ? actor.memberId : typeof requested === 'string' ? requested : actor.memberId
    if (childId === null) {
        return badRequest('Missing childId')
    }
    const db = getDb()
    await assertMembersInFamily(db, actor.familyId, [childId])
    const [owner] = await db<{ role: MemberRole }[]>`select role from members where id = ${childId} and family_id = ${actor.familyId} and deleted_at is null`
    if (!owner || !canAccessVault(actor.role, actor.memberId, owner.role, childId)) {
        throw createError({ statusCode: 403, statusMessage: 'This vault is private' })
    }
    const items = await db<ITreasure[]>`
        select id, child_id, source_message_id, from_member_id, file_id, mime, duration_ms, saved_by_member_id, created_at
        from treasures
        where family_id = ${actor.familyId} and child_id = ${childId} and deleted_at is null
        order by created_at desc
    `
    return { items, limit: TREASURE_LIMIT }
})
