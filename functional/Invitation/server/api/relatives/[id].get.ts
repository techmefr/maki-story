import { getDb } from '~~/server/utils/db'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<IRelativeOverview> => {
    const { familyId } = await requirePermission(event, 'members.manage')
    const id = requireParam(event, 'id')
    const db = getDb()
    const [relative] = await db<{ id: string }[]>`
        select id from members where id = ${id} and family_id = ${familyId} and role in ('relative', 'parent') and deleted_at is null and source_member_id is null
    `
    if (!relative) {
        return notFound('Member not found')
    }
    const messages = await db<IRelativeMessageCount[]>`
        select c.id as child_id, c.name as child_name, c.color as child_color,
            (select count(*)::int from messages m
                where m.from_member_id = ${id} and m.to_member_id = c.id and m.status = 'ACTIVE' and m.deleted_at is null
                    and not exists (select 1 from treasures t where t.source_message_id = m.id and t.deleted_at is null)) as count
        from members c where c.family_id = ${familyId} and c.role = 'child' and c.deleted_at is null order by c.created_at
    `
    const families = await db<{ name: string }[]>`
        select f.name from memberships ms
        join families f on f.id = ms.family_id and f.deleted_at is null
        where ms.account_id = (select account_id from memberships where member_id = ${id} and family_id = ${familyId})
        order by f.name
    `
    return { messages, families: families.map(item => item.name) }
})
