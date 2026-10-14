import { getDb } from '~~/server/utils/db'
import { requireActorMember, requirePermission } from '~~/technical/Auth/server/utils/permissions'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await requirePermission(event, 'books.create')
    const memberId = requireActorMember(actor)
    await getDb()`delete from book_drafts where member_id = ${memberId} and family_id = ${actor.familyId}`
    return { ok: true }
})
