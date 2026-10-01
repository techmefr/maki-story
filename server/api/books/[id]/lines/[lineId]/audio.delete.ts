import { checkLanguage } from '../../../../../utils/bookModel'
import { getDb } from '../../../../../utils/db'
import { logEvent } from '../../../../../utils/log'
import { assertCanRecordLine, requirePermission } from '../../../../../utils/permissions'
import { notFound, requireParam } from '../../../../../utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await requirePermission(event, 'lines.record')
    const { familyId } = actor
    const bookId = requireParam(event, 'id')
    const lineId = requireParam(event, 'lineId')
    const requested = getQuery(event).language
    const db = getDb()
    const [line] = await db<{ memberId: string | null; language: string }[]>`
        select l.member_id, b.language from lines l join books b on b.id = l.book_id
        where l.id = ${lineId} and l.book_id = ${bookId} and l.family_id = ${familyId} and b.deleted_at is null
    `
    if (!line) {
        return notFound('Line not found')
    }
    assertCanRecordLine(actor, line.memberId)
    const language = requested === undefined ? line.language : checkLanguage(requested)
    await db`delete from recordings where line_id = ${lineId} and family_id = ${familyId} and language = ${language}`
    logEvent('Enregistrement effacé (la phrase sera refaite)')
    return { ok: true }
})
