import { loadBook } from '../../utils/books'
import { getDb } from '../../utils/db'
import { assertMembersInFamily, requireFamily } from '../../utils/family'
import { logEvent } from '../../utils/log'
import { badRequest, requireParam } from '../../utils/validate'

const STATUSES: BookStatus[] = ['draft', 'to_record', 'ready']

export default defineEventHandler(async (event): Promise<IBook> => {
    const familyId = requireFamily(event)
    const id = requireParam(event, 'id')
    const body = await readBody<IBookPatch>(event)
    if (body.status !== undefined && !STATUSES.includes(body.status)) {
        return badRequest('Invalid status')
    }
    await loadBook(id, familyId)
    const db = getDb()
    const patchedMemberIds = [
        ...Object.keys(body.tones ?? {}),
        ...(body.lines ?? []).flatMap(patch => (patch.memberId ? [patch.memberId] : [])),
    ]
    await assertMembersInFamily(db, familyId, patchedMemberIds)
    await db.begin(async tx => {
        if (body.title !== undefined && body.title.trim() !== '') {
            await tx`update books set title = ${body.title.trim()} where id = ${id} and family_id = ${familyId}`
        }
        if (body.imageDesc !== undefined) {
            await tx`update books set image_desc = ${body.imageDesc} where id = ${id} and family_id = ${familyId}`
        }
        if (body.status !== undefined) {
            await tx`update books set status = ${body.status} where id = ${id} and family_id = ${familyId}`
        }
        for (const [memberId, tone] of Object.entries(body.tones ?? {})) {
            await tx`
                insert into book_voices (book_id, family_id, member_id, tone) values (${id}, ${familyId}, ${memberId}, ${tone})
                on conflict (book_id, member_id) do update set tone = excluded.tone
            `
        }
        for (const patch of body.lines ?? []) {
            if (patch.memberId !== undefined) {
                await tx`
                    update lines set member_id = ${patch.memberId},
                        audio_file_id = case when member_id is distinct from ${patch.memberId} then null else audio_file_id end,
                        audio_ms = case when member_id is distinct from ${patch.memberId} then 0 else audio_ms end
                    where id = ${patch.id} and book_id = ${id} and family_id = ${familyId}
                `
            }
            if (patch.note !== undefined) {
                await tx`update lines set note = ${patch.note} where id = ${patch.id} and book_id = ${id} and family_id = ${familyId}`
            }
        }
    })
    const book = await loadBook(id, familyId)
    if (body.status !== undefined) {
        logEvent(`Livre « ${book.title} » passé en statut ${body.status}`)
    }
    return book
})
