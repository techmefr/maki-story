import { deleteFamilyData } from '~~/server/utils/familyData'
import { getDb } from '~~/server/utils/db'
import { loadCodeRow, verifyMemberCode } from '~~/technical/Auth/server/utils/profile-code'
import { requireActorMember, requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { SESSION_COOKIE } from '~~/technical/Auth/server/utils/session'
import { badRequest } from '~~/server/utils/validate'

interface IDeleteBody {
    code?: string
    confirmName?: string
}

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await requirePermission(event, 'family.delete')
    const memberId = requireActorMember(actor)
    const body = await readBody<IDeleteBody>(event)
    const db = getDb()
    const row = await loadCodeRow(db, actor.familyId, memberId)
    if (!row) {
        throw createError({ statusCode: 403, statusMessage: 'Choose a profile first' })
    }
    await verifyMemberCode(db, actor.familyId, row, body.code)
    const [family] = await db<{ name: string }[]>`select name from families where id = ${actor.familyId}`
    if (!family || typeof body.confirmName !== 'string' || body.confirmName.trim().toLowerCase() !== family.name.trim().toLowerCase()) {
        return badRequest('The family name does not match')
    }
    await deleteFamilyData(db, actor.familyId)
    deleteCookie(event, SESSION_COOKIE, { path: '/' })
    return { ok: true }
})
