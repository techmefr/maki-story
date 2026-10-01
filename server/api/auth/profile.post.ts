import { getDb } from '../../utils/db'
import { requireSession } from '../../utils/family'
import { hashCode, loadCodeRow, readCodeInput, verifyMemberCode } from '../../utils/profile-code'
import { startSession } from '../../utils/session'
import { notFound } from '../../utils/validate'

interface IProfileBody extends IProfileProof {
    memberId?: string | null
}

export default defineEventHandler(async (event): Promise<IAuthState> => {
    const session = requireSession(event)
    const body = await readBody<IProfileBody>(event)
    const memberId = typeof body.memberId === 'string' ? body.memberId : null
    if (memberId === null) {
        startSession(event, { ...session, memberId: null })
        return { isSignedIn: true, memberId: null }
    }
    const db = getDb()
    const row = await loadCodeRow(db, session.familyId, memberId)
    if (!row || row.status !== 'active') {
        return notFound('Member not found')
    }
    if (row.pinHash) {
        await verifyMemberCode(db, session.familyId, row, body.code)
    } else {
        if (row.role === 'child' || session.memberId !== null) {
            throw createError({ statusCode: 403, statusMessage: 'A parent must set this code' })
        }
        const newCode = readCodeInput(body.newCode)
        const hash = await hashCode(newCode)
        const updated = await db<{ id: string }[]>`
            update members set pin_hash = ${hash}, code_kind = ${newCode.kind}
            where id = ${memberId} and family_id = ${session.familyId} and pin_hash is null and deleted_at is null
            returning id
        `
        if (updated.length === 0) {
            throw createError({ statusCode: 409, statusMessage: 'A code already exists' })
        }
    }
    startSession(event, { ...session, memberId })
    return { isSignedIn: true, memberId }
})
