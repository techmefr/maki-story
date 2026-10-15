import { requestKindForReason } from '~~/shared/utils/accessControl'
import { getDb } from '~~/server/utils/db'
import { requireSession } from '~~/server/utils/family'
import { createHomeworkRequest } from '~~/server/utils/homework'
import { accessForMember } from '~~/server/utils/parental'
import { badRequest } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<IHomeworkReply> => {
    const session = requireSession(event)
    if (!session.memberId) {
        return badRequest('A child session is required')
    }
    const db = getDb()
    const access = await accessForMember(db, session.familyId, session.memberId, session.memberSince)
    const kind = requestKindForReason(access.reason)
    if (access.isAllowed || kind === null) {
        return badRequest('There is nothing to ask for right now')
    }
    const status = await createHomeworkRequest(db, session.familyId, session.memberId, kind, session.memberSince)
    return { status, message: 'Request sent to your parents' }
})
