import { getDb } from '../../../utils/db'
import { actorEntry, record } from '../../../utils/journal'
import { requirePermission } from '../../../utils/permissions'
import { badRequest, notFound, requireParam } from '../../../utils/validate'

export default defineEventHandler(async (event): Promise<{ deleted: number }> => {
    const actor = await requirePermission(event, 'members.manage')
    const { familyId } = actor
    const id = requireParam(event, 'id')
    const db = getDb()
    const [member] = await db<{ role: MemberRole; status: MemberStatus }[]>`
        select role, status from members where id = ${id} and family_id = ${familyId} and deleted_at is null and source_member_id is null
    `
    if (!member) {
        return notFound('Member not found')
    }
    if (member.role !== 'relative' || (member.status !== 'left' && member.status !== 'deceased')) {
        return badRequest('Only the voice of a departed relative can be deleted')
    }
    const deleted = await db.begin(async tx => {
        await tx`
            delete from approved_takes where member_id = ${id} and family_id = ${familyId}
        `
        const rows = await tx`
            update recordings set deleted_at = now(), deleted_status = status, status = 'stale'
            where member_id = ${id} and family_id = ${familyId} and deleted_at is null
            returning id
        `
        return rows.length
    })
    await record(event, { ...actorEntry(actor), action: 'member.voice.deleted', entityType: 'member', entityId: id, after: { recordings: deleted } })
    return { deleted }
})
