import { writeAudit } from '~~/server/utils/audit'
import { getDb } from '~~/server/utils/db'
import { requirePermission } from '~~/server/utils/permissions'
import { loadCodeRow, readCodeInput, requireActor, storeMemberCode, verifyMemberCode } from '~~/server/utils/profile-code'
import { notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async event => {
    const actor = await requireActor(event)
    const id = requireParam(event, 'id')
    const body = await readBody<Partial<IMemberCodeUpdate>>(event)
    const db = getDb()
    const target = await loadCodeRow(db, actor.familyId, id)
    if (!target) {
        return notFound('Member not found')
    }
    const input = readCodeInput(body, target.role)
    const isSelf = actor.id === target.id
    if (isSelf) {
        if (actor.role === 'child') {
            throw createError({ statusCode: 403, statusMessage: 'Not allowed to change this code' })
        }
        if (target.pinHash) {
            await verifyMemberCode(db, actor.familyId, target, body.currentCode)
        }
    } else {
        await requirePermission(event, 'members.code.manage')
    }
    await storeMemberCode(db, actor.familyId, target.id, input)
    if (!isSelf) {
        await writeAudit(db, { familyId: actor.familyId, actorId: actor.id, targetId: target.id, action: 'member.code.set', details: { kind: input.kind } })
    }
    return { ok: true }
})
