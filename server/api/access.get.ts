import { getDb } from '../utils/db'
import { requireSession } from '../utils/family'
import { accessForMember } from '../utils/parental'

export default defineEventHandler(async (event): Promise<IAccessStatus> => {
    const session = requireSession(event)
    if (!session.memberId) {
        return { isAllowed: true, reason: null, resumeAt: null }
    }
    return accessForMember(getDb(), session.familyId, session.memberId)
})
