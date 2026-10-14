import { getDb } from '~~/server/utils/db'
import { requireActorMember, requirePermission } from '~~/technical/Auth/server/utils/permissions'

export default defineEventHandler(async (event): Promise<{ payload: Record<string, unknown>; updatedAt: string } | null> => {
    const actor = await requirePermission(event, 'books.create')
    const memberId = requireActorMember(actor)
    const [row] = await getDb()<{ payload: Record<string, unknown>; updatedAt: string }[]>`
        select payload, updated_at from book_drafts where member_id = ${memberId} and family_id = ${actor.familyId}
    `
    return row ?? null
})
