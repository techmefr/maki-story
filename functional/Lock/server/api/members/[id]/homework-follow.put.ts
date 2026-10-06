import { writeAudit } from '~~/server/utils/audit'
import { getDb } from '~~/server/utils/db'
import { saveHomeworkFollow } from '~~/server/utils/homework'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { loadCodeRow } from '~~/technical/Auth/server/utils/profile-code'
import { badRequest, notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<IHomeworkFollow> => {
    const actor = await requirePermission(event, 'members.schedule.manage')
    const id = requireParam(event, 'id')
    const body = await readBody<Partial<IHomeworkFollow>>(event)
    if (typeof body.isEnabled !== 'boolean') {
        return badRequest('Invalid homework follow-up')
    }
    const db = getDb()
    const target = await loadCodeRow(db, actor.familyId, id)
    if (!target) {
        return notFound('Member not found')
    }
    if (target.role !== 'child') {
        return badRequest('Only a child profile can follow homework')
    }
    await saveHomeworkFollow(db, actor.familyId, target.id, body.isEnabled)
    await writeAudit(db, {
        familyId: actor.familyId,
        actorId: actor.memberId,
        targetId: target.id,
        action: 'member.homework.follow',
        details: { isEnabled: body.isEnabled },
    })
    return { isEnabled: body.isEnabled }
})
