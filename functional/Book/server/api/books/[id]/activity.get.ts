import { assertBookReadable } from '~~/server/utils/books'
import { getDb } from '~~/server/utils/db'
import { requireActorMember, requireRole } from '~~/server/utils/permissions'
import { requireParam } from '~~/server/utils/validate'

const MAX_ITEMS = 100

export default defineEventHandler(async (event): Promise<IBookActivity> => {
    const actor = await requireRole(event, 'parent', 'child')
    const memberId = requireActorMember(actor)
    const bookId = requireParam(event, 'id')
    await assertBookReadable(actor, bookId)
    const db = getDb()
    const [visit] = await db<{ lastSeenAt: string }[]>`
        select last_seen_at from book_visits where member_id = ${memberId} and book_id = ${bookId}
    `
    const isChild = actor.role === 'child'
    const rows = await db<Omit<IActivityItem, 'isNew'>[]>`
        select id, kind, line_id, actor_member_id, subject_member_id, case when ${isChild} then '' else body end as body, count, created_at
        from book_activity
        where book_id = ${bookId} and family_id = ${actor.familyId} and (not ${isChild} or kind = 'voice_added')
        order by created_at desc limit ${MAX_ITEMS}
    `
    const lastSeenAt = visit?.lastSeenAt ?? null
    const items = rows.map(row => ({
        ...row,
        isNew: lastSeenAt === null || new Date(row.createdAt).getTime() > new Date(lastSeenAt).getTime(),
    }))
    return { lastSeenAt, newCount: items.filter(item => item.isNew).length, items }
})
