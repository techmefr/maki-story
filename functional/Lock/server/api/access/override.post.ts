import { OVERRIDE_MINUTES } from '~~/shared/utils/schedule'
import { writeAudit } from '~~/server/utils/audit'
import { getDb } from '~~/server/utils/db'
import { requireSession } from '~~/server/utils/family'
import { loadActiveOverride, loadSchedule, saveOverride } from '~~/server/utils/parental'
import { loadCodeRow, verifyMemberCode } from '~~/technical/Auth/server/utils/profile-code'
import { badRequest } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<IAccessSnapshot> => {
    const session = requireSession(event)
    const body = await readBody<Partial<IAccessOverrideInput>>(event)
    if (!session.memberId || typeof body.parentId !== 'string') {
        return badRequest('A child session and a parent are required')
    }
    const db = getDb()
    const child = await loadCodeRow(db, session.familyId, session.memberId)
    const parent = await loadCodeRow(db, session.familyId, body.parentId)
    if (!child || child.role !== 'child' || !parent || parent.role !== 'parent' || parent.status !== 'active') {
        throw createError({ statusCode: 403, statusMessage: 'Only a parent can unlock a child' })
    }
    await verifyMemberCode(db, session.familyId, parent, body.code)
    const overrideUntil = await saveOverride(db, session.familyId, child.id, parent.id, OVERRIDE_MINUTES)
    await writeAudit(db, {
        familyId: session.familyId,
        actorId: parent.id,
        targetId: child.id,
        action: 'member.access.override',
        details: { minutes: OVERRIDE_MINUTES, until: overrideUntil },
    })
    const schedule = await loadSchedule(db, session.familyId, child.id)
    return { isAllowed: true, reason: null, resumeAt: null, schedule, overrideUntil: (await loadActiveOverride(db, session.familyId, child.id)) ?? overrideUntil, homework: 'none' }
})
