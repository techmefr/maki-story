import { getDb, one } from '../../../utils/db'
import { requireFamily } from '../../../utils/family'
import { logEvent } from '../../../utils/log'
import { assertUploadLive, loadUploadSession } from '../../../utils/uploads'

export default defineEventHandler(async (event): Promise<{ id: string }> => {
    const familyId = requireFamily(event)
    return getDb().begin(async tx => {
        const session = await loadUploadSession(tx, event, familyId, true)
        await assertUploadLive(tx, session)
        if (session.received !== session.size) {
            throw createError({
                statusCode: 409,
                statusMessage: 'Upload incomplete',
                data: { offset: session.received, size: session.size },
            })
        }
        const file = one(await tx<{ id: string }[]>`
            insert into files (family_id, mime, data)
            select ${familyId}, ${session.mime}, string_agg(data, ''::bytea order by chunk_offset)
            from upload_chunks where upload_id = ${session.id}
            returning id
        `)
        await tx`delete from upload_sessions where id = ${session.id}`
        logEvent(`Fichier assemblé (${session.mime}, ${Math.round(session.size / 1024)} Ko)`)
        return file
    })
})
