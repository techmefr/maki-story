import { assertBookReadable } from '~~/server/utils/books'
import { getDb } from '~~/server/utils/db'
import { requireActorMember, requireRole } from '~~/server/utils/permissions'
import { requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await requireRole(event, 'parent', 'child')
    const memberId = requireActorMember(actor)
    const bookId = requireParam(event, 'id')
    await assertBookReadable(actor, bookId)
    await getDb()`
        insert into book_visits (member_id, book_id, family_id, last_seen_at) values (${memberId}, ${bookId}, ${actor.familyId}, now())
        on conflict (member_id, book_id) do update set last_seen_at = now()
    `
    return { ok: true }
})
