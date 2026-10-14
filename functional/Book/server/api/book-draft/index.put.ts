import { getDb } from '~~/server/utils/db'
import { requireActorMember, requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { badRequest } from '~~/server/utils/validate'

const MAX_DRAFT_BYTES = 512 * 1024

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await requirePermission(event, 'books.create')
    const memberId = requireActorMember(actor)
    const body = await readBody<{ payload?: unknown }>(event)
    const payload = body?.payload
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
        return badRequest('Invalid draft')
    }
    const text = JSON.stringify(payload)
    if (text.length > MAX_DRAFT_BYTES) {
        return badRequest('Draft is too large')
    }
    const db = getDb()
    await db`
        insert into book_drafts (member_id, family_id, payload, updated_at)
        values (${memberId}, ${actor.familyId}, ${db.json(JSON.parse(text))}, now())
        on conflict (member_id) do update set payload = excluded.payload, updated_at = now(), family_id = excluded.family_id
    `
    return { ok: true }
})
