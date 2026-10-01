import { getDb, one } from '../../../utils/db'
import { logEvent } from '../../../utils/log'
import { assertUploadLive, loadUploadSession } from '../../../utils/uploads'
import { requirePermission } from '../../../utils/permissions'

export default defineEventHandler(async (event): Promise<{ id: string }> => {
    const actor = await requirePermission(event, 'files.upload')
    const { familyId } = actor
    return getDb().begin(async tx => {
        const session = await loadUploadSession(tx, event, actor, true)
        await assertUploadLive(tx, session)
        if (session.received !== session.size) {
            throw createError({
                statusCode: 409,
                statusMessage: 'Upload incomplete',
                data: { offset: session.received, size: session.size },
            })
        }
        const file = one(await tx<{ id: string }[]>`
            insert into files (family_id, mime, data, created_by_member_id)
            select ${familyId}, ${session.mime}, string_agg(data, ''::bytea order by chunk_offset), ${actor.memberId}
            from upload_chunks where upload_id = ${session.id}
            returning id
        `)
        await tx`delete from upload_sessions where id = ${session.id}`
        logEvent(`Fichier assemblé (${session.mime}, ${Math.round(session.size / 1024)} Ko)`)
        return file
    })
})
