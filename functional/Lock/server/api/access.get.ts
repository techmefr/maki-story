import { getDb } from '~~/server/utils/db'
import { requireSession } from '~~/server/utils/family'
import { snapshotFor } from '~~/server/utils/parental'

export default defineEventHandler(async (event): Promise<IAccessSnapshot> => {
    const session = requireSession(event)
    if (!session.memberId) {
        return { isAllowed: true, reason: null, resumeAt: null, schedule: null, overrideUntil: null, homework: 'none', controls: null, nightStartsAt: null }
    }
    return snapshotFor(getDb(), session.familyId, session.memberId, session.memberSince)
})
