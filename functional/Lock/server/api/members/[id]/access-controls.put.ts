import { isValidControls } from '~~/shared/utils/accessControl'
import { writeAudit } from '~~/server/utils/audit'
import { saveControls } from '~~/server/utils/accessControl'
import { getDb } from '~~/server/utils/db'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { loadCodeRow } from '~~/technical/Auth/server/utils/profile-code'
import { badRequest, notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<IAccessControls> => {
    const actor = await requirePermission(event, 'members.schedule.manage')
    const id = requireParam(event, 'id')
    const body = await readBody<unknown>(event)
    if (!isValidControls(body)) {
        return badRequest('Invalid access controls')
    }
    const db = getDb()
    const target = await loadCodeRow(db, actor.familyId, id)
    if (!target) {
        return notFound('Member not found')
    }
    if (target.role !== 'child') {
        return badRequest('Only a child profile has access controls')
    }
    await saveControls(db, actor.familyId, target.id, body)
    await writeAudit(db, {
        familyId: actor.familyId,
        actorId: actor.memberId,
        targetId: target.id,
        action: 'member.access-controls.updated',
        details: { night: body.night, listening: body.listening, homework: body.homework, isApprovalEnabled: body.isApprovalEnabled, timezone: body.timezone },
    })
    return body
})
