import { getDb } from '../../utils/db'
import { requireFamily } from '../../utils/family'
import { logEvent } from '../../utils/log'
import { requireParam } from '../../utils/validate'

export default defineEventHandler(async event => {
    const familyId = requireFamily(event)
    const id = requireParam(event, 'id')
    await getDb()`update feedback set deleted_at = now() where id = ${id} and family_id = ${familyId} and deleted_at is null`
    logEvent(`Avis archivé (soft delete) : ${id}`)
    return { ok: true }
})
