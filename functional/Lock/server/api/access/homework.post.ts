import { getDb } from '~~/server/utils/db'
import { requireSession } from '~~/server/utils/family'
import { createHomeworkRequest, isHomeworkFollowed } from '~~/server/utils/homework'
import { badRequest } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<IHomeworkReply> => {
    const session = requireSession(event)
    const db = getDb()
    if (!session.memberId || !(await isHomeworkFollowed(db, session.familyId, session.memberId))) {
        return badRequest('Homework follow-up is not enabled for this profile')
    }
    const status = await createHomeworkRequest(db, session.familyId, session.memberId)
    return { status, message: 'Request sent to your parents' }
})
