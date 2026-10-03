import { getDb } from '~~/server/utils/db'
import { logEvent } from '~~/server/utils/log'
import { requirePermission } from '~~/server/utils/permissions'
import { requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async event => {
    const { familyId } = await requirePermission(event, 'feedback.manage')
    const id = requireParam(event, 'id')
    await getDb()`update feedback set deleted_at = now() where id = ${id} and family_id = ${familyId} and deleted_at is null`
    logEvent(`Avis archivé (soft delete) : ${id}`)
    return { ok: true }
})
