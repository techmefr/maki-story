import { getDb } from '~~/server/utils/db'
import { loadHomeworkGate } from '~~/server/utils/homework'
import { requireSession } from '~~/server/utils/family'
import { accessForMember, loadActiveOverride, loadSchedule } from '~~/server/utils/parental'

export default defineEventHandler(async (event): Promise<IAccessSnapshot> => {
    const session = requireSession(event)
    if (!session.memberId) {
        return { isAllowed: true, reason: null, resumeAt: null, schedule: null, overrideUntil: null, homework: 'none' }
    }
    const db = getDb()
    const [status, schedule, overrideUntil, homework] = await Promise.all([
        accessForMember(db, session.familyId, session.memberId),
        loadSchedule(db, session.familyId, session.memberId),
        loadActiveOverride(db, session.familyId, session.memberId),
        loadHomeworkGate(db, session.familyId, session.memberId),
    ])
    return { ...status, schedule, overrideUntil, homework }
})
