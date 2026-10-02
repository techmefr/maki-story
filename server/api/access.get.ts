import { getDb } from '../utils/db'
import { requireSession } from '../utils/family'
import { accessForMember, loadActiveOverride, loadSchedule } from '../utils/parental'

export default defineEventHandler(async (event): Promise<IAccessSnapshot> => {
    const session = requireSession(event)
    if (!session.memberId) {
        return { isAllowed: true, reason: null, resumeAt: null, schedule: null, overrideUntil: null }
    }
    const db = getDb()
    const [status, schedule, overrideUntil] = await Promise.all([
        accessForMember(db, session.familyId, session.memberId),
        loadSchedule(db, session.familyId, session.memberId),
        loadActiveOverride(db, session.familyId, session.memberId),
    ])
    return { ...status, schedule, overrideUntil }
})
