import { getDb } from '../../../utils/db'
import { loadCodeRow, readCodeInput, requireActor, storeMemberCode, verifyMemberCode } from '../../../utils/profile-code'
import { notFound, requireParam } from '../../../utils/validate'

export default defineEventHandler(async event => {
    const actor = await requireActor(event)
    const id = requireParam(event, 'id')
    const body = await readBody<Partial<IMemberCodeUpdate>>(event)
    const input = readCodeInput(body)
    const db = getDb()
    const target = await loadCodeRow(db, actor.familyId, id)
    if (!target) {
        return notFound('Member not found')
    }
    const isSelf = actor.id === target.id
    const isParentManagingOther = actor.role === 'parent' && target.role !== 'parent'
    if (actor.role === 'child' || !(isSelf || isParentManagingOther)) {
        throw createError({ statusCode: 403, statusMessage: 'Not allowed to change this code' })
    }
    if (isSelf && target.pinHash) {
        await verifyMemberCode(db, actor.familyId, target, body.currentCode)
    }
    await storeMemberCode(db, actor.familyId, target.id, input)
    return { ok: true }
})
