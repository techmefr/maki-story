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
    await db`
        update members set code_failed_attempts = 0, code_locked_until = null
        where id = ${target.id} and family_id = ${actor.familyId}
    `
    await writeAudit(db, { familyId: actor.familyId, actorId: actor.memberId, targetId: target.id, action: 'member.code.unlocked' })
    return { ok: true }
})
