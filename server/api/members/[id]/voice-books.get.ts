import { getDb } from '../../../utils/db'
import { requirePermission } from '../../../utils/permissions'
import { notFound, requireParam } from '../../../utils/validate'

export default defineEventHandler(async (event): Promise<IVoiceBook[]> => {
    const { familyId } = await requirePermission(event, 'members.manage')
    const id = requireParam(event, 'id')
    const db = getDb()
    const [member] = await db<{ id: string }[]>`select id from members where id = ${id} and family_id = ${familyId} and deleted_at is null`
    if (!member) {
        return notFound('Member not found')
    }
    return db<IVoiceBook[]>`
        select b.id, b.title, count(distinct l.id)::int as line_count
        from recordings r
        join lines l on l.id = r.line_id
        join books b on b.id = l.book_id
        where r.member_id = ${id} and r.family_id = ${familyId} and r.status <> 'stale' and b.deleted_at is null
        group by b.id, b.title, b.created_at
        order by b.created_at desc
    `
})
