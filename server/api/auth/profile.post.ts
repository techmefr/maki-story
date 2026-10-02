import { getDb } from '../../utils/db'
import { verifyDeviceSecret } from '../../utils/device'
import { requireSession } from '../../utils/family'
import { isFamilyParentAccount, relativeMemberFor } from '../../utils/memberships'
import { hashCode,loadCodeRow, readCodeInput, verifyMemberCode } from '../../utils/profile-code'
import { startSession } from '../../utils/session'
import { notFound } from '../../utils/validate'

interface IProfileBody extends IProfileProof {
    memberId?: string | null
}

export default defineEventHandler(async (event): Promise<IAuthState> => {
    const session = requireSession(event)
    const body = await readBody<IProfileBody>(event)
    const memberId = typeof body.memberId === 'string' ? body.memberId : null
    const db = getDb()
    if (!(await isFamilyParentAccount(db, session.accountId, session.familyId))) {
        const ownMemberId = await relativeMemberFor(db, session.accountId, session.familyId)
        if (ownMemberId === null || (memberId !== null && memberId !== ownMemberId)) {
            throw createError({ statusCode: 403, statusMessage: 'This account has no access to that profile' })
        }
        startSession(event, { ...session, memberId: ownMemberId })
        return { isSignedIn: true, memberId: ownMemberId, isRelativeAccount: true }
    }
    if (memberId === null) {
        startSession(event, { ...session, memberId: null })
        return { isSignedIn: true, memberId: null }
    }
    const row = await loadCodeRow(db, session.familyId, memberId)
    if (!row || row.status !== 'active') {
        return notFound('Member not found')
    }
    if (body.device !== undefined) {
        await verifyDeviceSecret(event, db, session.familyId, row.id, body.device)
    } else if (row.role === 'child' && !row.codeEnabled) {
        startSession(event, { ...session, memberId })
        return { isSignedIn: true, memberId }
    } else if (row.pinHash) {
        await verifyMemberCode(db, session.familyId, row, body.code)
    } else {
        if (row.role === 'child' || session.memberId !== null) {
            throw createError({ statusCode: 403, statusMessage: 'A parent must set this code' })
        }
        const newCode = readCodeInput(body.newCode, row.role)
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
