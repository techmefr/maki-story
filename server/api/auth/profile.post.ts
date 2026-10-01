import { getDb } from '../../utils/db'
import { requireSession } from '../../utils/family'
import { startSession } from '../../utils/session'
import { notFound } from '../../utils/validate'

export default defineEventHandler(async (event): Promise<IAuthState> => {
    const session = requireSession(event)
    const body = await readBody<{ memberId?: string | null }>(event)
    const memberId = typeof body.memberId === 'string' ? body.memberId : null
    if (memberId !== null) {
        const [member] = await getDb()<{ id: string }[]>`
            select id from members where id = ${memberId} and family_id = ${session.familyId} and deleted_at is null
        `
        if (!member) {
            return notFound('Member not found')
        }
    }
    startSession(event, { ...session, memberId })
    return { isSignedIn: true, memberId }
})
