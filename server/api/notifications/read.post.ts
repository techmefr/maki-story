import { getDb } from '../../utils/db'
import { requirePermission } from '../../utils/permissions'
import { isNonEmptyString } from '../../utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await requirePermission(event, 'notifications.list')
    const isParent = actor.role === 'parent'
    const body = (await readBody<{ ids?: string[] }>(event)) ?? {}
    const ids = Array.isArray(body.ids) ? body.ids.filter(isNonEmptyString) : null
    const db = getDb()
    await db`
        update notifications set read_at = now()
        where family_id = ${actor.familyId} and read_at is null
            and (recipient_member_id = ${actor.memberId} or (recipient_member_id is null and ${isParent}))
            and (${ids === null} or id in ${db(ids ?? [''])})
    `
    return { ok: true }
})
