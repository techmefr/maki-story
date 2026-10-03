import { writeAudit } from '~~/server/utils/audit'
import { getDb } from '~~/server/utils/db'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { loadCodeRow } from '~~/technical/Auth/server/utils/profile-code'
import { notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async event => {
    const actor = await requirePermission(event, 'members.code.manage')
    const id = requireParam(event, 'id')
    const db = getDb()
    const target = await loadCodeRow(db, actor.familyId, id)
    if (!target) {
        return notFound('Member not found')
    }
    if (actor.memberId === target.id) {
        throw createError({ statusCode: 403, statusMessage: 'Use another parent to remove your own code' })
    }
    await db`
        update members
        set pin_hash = null, code_kind = null, code_failed_attempts = 0, code_locked_until = null
        where id = ${target.id} and family_id = ${actor.familyId}
    `
    await writeAudit(db, { familyId: actor.familyId, actorId: actor.memberId, targetId: target.id, action: 'member.code.removed' })
    return { ok: true }
})
