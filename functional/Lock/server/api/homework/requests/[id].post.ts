import { writeAudit } from '~~/server/utils/audit'
import { getDb } from '~~/server/utils/db'
import { decideHomework } from '~~/server/utils/homework'
import { requireActorMember, requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { badRequest, notFound, requireParam } from '~~/server/utils/validate'

const DECISIONS: THomeworkDecision[] = ['approved', 'refused']

export default defineEventHandler(async (event): Promise<IHomeworkReply> => {
    const actor = await requirePermission(event, 'members.schedule.manage')
    const id = requireParam(event, 'id')
    const body = await readBody<Partial<IHomeworkDecisionInput>>(event)
    if (!DECISIONS.includes(body.decision as THomeworkDecision)) {
        return badRequest('Invalid decision')
    }
    const decision = body.decision as THomeworkDecision
    const db = getDb()
    const [request] = await db<{ childId: string }[]>`select child_id from homework_requests where id = ${id} and family_id = ${actor.familyId}`
    if (!request) {
        return notFound('Request not found')
    }
    const isDecided = await decideHomework(db, actor.familyId, id, requireActorMember(actor), decision)
    if (!isDecided) {
        throw createError({ statusCode: 409, statusMessage: 'Another parent already answered this request' })
    }
    await writeAudit(db, {
        familyId: actor.familyId,
        actorId: actor.memberId,
        targetId: request.childId,
        action: 'member.homework.decided',
        details: { decision },
    })
    return { status: decision, message: 'Answer saved' }
})
