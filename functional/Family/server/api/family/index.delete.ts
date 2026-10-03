import { deleteFamilyData, TOMBSTONE_RESTORE_DAYS } from '~~/server/utils/familyData'
import { getDb } from '~~/server/utils/db'
import { DELETE_WORDS } from '~~/shared/utils/legal'
import { loadCodeRow, verifyMemberCode } from '~~/technical/Auth/server/utils/profile-code'
import { requireActorMember, requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { SESSION_COOKIE } from '~~/technical/Auth/server/utils/session'
import { sendMail } from '~~/technical/Mail/server/utils/mail'
import { mailText } from '~~/technical/Mail/server/utils/mailTexts'
import { badRequest } from '~~/server/utils/validate'

interface IDeleteBody {
    code?: string
    confirmName?: string
    confirmWord?: string
    locale?: string
}

const isConfirmed = (body: IDeleteBody, familyName: string): boolean => {
    if (typeof body.confirmWord === 'string' && DELETE_WORDS.includes(body.confirmWord.trim().toUpperCase())) {
        return true
    }
    return typeof body.confirmName === 'string' && body.confirmName.trim().toLowerCase() === familyName.trim().toLowerCase()
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
    if (!family || !isConfirmed(body, family.name)) {
        return badRequest('The confirmation does not match')
    }
    const [account] = await db<{ email: string }[]>`select email from accounts where id = ${actor.accountId}`
    await deleteFamilyData(db, actor.familyId)
    deleteCookie(event, SESSION_COOKIE, { path: '/' })
    if (account) {
        const locale = typeof body.locale === 'string' ? body.locale : null
        await sendMail({
            to: account.email,
            subject: mailText(locale, 'deleted.subject'),
            text: mailText(locale, 'deleted.body', { family: family.name, days: TOMBSTONE_RESTORE_DAYS }),
        })
    }
    return { ok: true }
})
