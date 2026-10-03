import { getDb } from '~~/server/utils/db'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { badRequest, notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<{ role: InvitationRole }> => {
    const { familyId, memberId: actorId } = await requirePermission(event, 'members.manage')
    const id = requireParam(event, 'id')
    const body = await readBody<{ role?: unknown }>(event)
    if (body.role !== 'parent' && body.role !== 'relative') {
        return badRequest('Invalid role')
    }
    const nextRole: InvitationRole = body.role
    if (id === actorId) {
        return badRequest('You cannot change your own role')
    }
    const db = getDb()
    await db.begin(async tx => {
        const [target] = await tx<{ role: MemberRole; accountId: string | null }[]>`
            select m.role, ms.account_id from members m
            left join memberships ms on ms.family_id = m.family_id and ms.member_id = m.id
            where m.id = ${id} and m.family_id = ${familyId} and m.role in ('parent', 'relative') and m.deleted_at is null and m.source_member_id is null
        `
        if (!target || target.accountId === null) {
            return notFound('This member has no account to change')
        }
        if (target.role === nextRole) {
            return
        }
        if (nextRole === 'relative') {
            const [others] = await tx<{ count: number }[]>`
                select count(*)::int as count from members where family_id = ${familyId} and role = 'parent' and deleted_at is null and id <> ${id}
            `
            if (!others || others.count === 0) {
                return badRequest('At least one parent is required')
            }
            await tx`delete from account_families where account_id = ${target.accountId} and family_id = ${familyId}`
            await tx`update memberships set role = 'relative', updated_at = now() where account_id = ${target.accountId} and family_id = ${familyId}`
        } else {
            await tx`insert into account_families (account_id, family_id) values (${target.accountId}, ${familyId}) on conflict do nothing`
            await tx`update memberships set role = 'parent', child_ids = array[]::text[], updated_at = now() where account_id = ${target.accountId} and family_id = ${familyId}`
        }
        await tx`update members set role = ${nextRole} where id = ${id}`
    })
    return { role: nextRole }
})
