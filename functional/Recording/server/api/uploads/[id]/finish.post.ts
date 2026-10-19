import { completeUpload } from '~~/technical/Upload/server/utils/completeUpload'
import { getDb } from '~~/server/utils/db'
import { logEvent } from '~~/server/utils/log'
import { assertUploadLive, loadUploadSession } from '~~/technical/Upload/server/utils/uploads'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'

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
        const id = await completeUpload(tx, session.id, familyId, actor.memberId)
        logEvent(`Fichier assemblé (${session.mime}, ${Math.round(session.size / 1024)} Ko)`)
        return { id }
    })
})
