import { loadBook } from '../../utils/books'
import { getDb } from '../../utils/db'
import { badRequest, requireParam } from '../../utils/validate'

const STATUSES: BookStatus[] = ['draft', 'to_record', 'ready']

export default defineEventHandler(async (event): Promise<IBook> => {
    const id = requireParam(event, 'id')
    const body = await readBody<IBookPatch>(event)
    if (body.status !== undefined && !STATUSES.includes(body.status)) {
        return badRequest('Invalid status')
    }
    await loadBook(id)
    await getDb().begin(async tx => {
        if (body.title !== undefined && body.title.trim() !== '') {
            await tx`update books set title = ${body.title.trim()} where id = ${id}`
        }
        if (body.imageDesc !== undefined) {
            await tx`update books set image_desc = ${body.imageDesc} where id = ${id}`
        }
        if (body.status !== undefined) {
            await tx`update books set status = ${body.status} where id = ${id}`
        }
        for (const [memberId, tone] of Object.entries(body.tones ?? {})) {
            await tx`
                insert into book_voices (book_id, member_id, tone) values (${id}, ${memberId}, ${tone})
                on conflict (book_id, member_id) do update set tone = excluded.tone
            `
        }
        for (const patch of body.lines ?? []) {
            if (patch.memberId !== undefined) {
                await tx`
                    update lines set member_id = ${patch.memberId},
                        audio_file_id = case when member_id is distinct from ${patch.memberId} then null else audio_file_id end,
                        audio_ms = case when member_id is distinct from ${patch.memberId} then 0 else audio_ms end
                    where id = ${patch.id} and book_id = ${id}
                `
            }
            if (patch.note !== undefined) {
                await tx`update lines set note = ${patch.note} where id = ${patch.id} and book_id = ${id}`
            }
        }
    })
    return loadBook(id)
})
