import { isValidTimezone, isValidWeekly } from '~~/shared/utils/schedule'
import { writeAudit } from '~~/server/utils/audit'
import { getDb } from '~~/server/utils/db'
import { saveSchedule } from '~~/server/utils/parental'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { loadCodeRow } from '~~/technical/Auth/server/utils/profile-code'
import { badRequest, notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async event => {
    const actor = await requirePermission(event, 'members.schedule.manage')
    const id = requireParam(event, 'id')
    const body = await readBody<Partial<IScheduleInput>>(event)
    if (typeof body.isEnabled !== 'boolean' || !isValidWeekly(body.weekly) || !isValidTimezone(body.timezone)) {
        return badRequest('Invalid schedule')
    }
    const db = getDb()
    const target = await loadCodeRow(db, actor.familyId, id)
    if (!target) {
        return notFound('Member not found')
    }
    if (target.role !== 'child') {
        return badRequest('Only a child profile has a schedule')
    }
    const input: IScheduleInput = { isEnabled: body.isEnabled, weekly: body.weekly, timezone: body.timezone }
    await saveSchedule(db, actor.familyId, target.id, input)
    await writeAudit(db, {
        familyId: actor.familyId,
        actorId: actor.memberId,
        targetId: target.id,
        action: 'member.schedule.updated',
        details: { isEnabled: input.isEnabled, timezone: input.timezone, weekly: input.weekly },
    })
    return { ok: true }
})
