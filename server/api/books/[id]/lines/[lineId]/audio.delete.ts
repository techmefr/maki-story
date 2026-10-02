import { checkLanguage } from '../../../../../utils/bookModel'
import { getDb } from '../../../../../utils/db'
import { actorEntry, record } from '../../../../../utils/journal'
import { logEvent } from '../../../../../utils/log'
import { dropApprovedTake } from '../../../../../utils/recordings'
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
    await dropApprovedTake(db, lineId, familyId, language)
    await record(event, { ...actorEntry(actor), action: 'recording.deleted', entityType: 'line', entityId: lineId, after: { language } })
    logEvent('Enregistrement effacé (la phrase sera refaite)')
    return { ok: true }
})
