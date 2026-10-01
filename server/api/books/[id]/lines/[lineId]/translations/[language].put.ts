import { checkLanguage, checkText } from '../../../../../../utils/bookModel'
import { getDb, one } from '../../../../../../utils/db'
import { requireBookEditor } from '../../../../../../utils/permissions'
import { markLineRecordingsStale } from '../../../../../../utils/recordings'
import { badRequest, isNonEmptyString, notFound, requireParam } from '../../../../../../utils/validate'

export default defineEventHandler(async (event): Promise<ILineTranslation> => {
    const { familyId } = await requireBookEditor(event)
    const bookId = requireParam(event, 'id')
    const lineId = requireParam(event, 'lineId')
    const language = checkLanguage(requireParam(event, 'language'))
    const body = await readBody<ITranslationBody>(event)
    if (!isNonEmptyString(body.text)) {
        return badRequest('A translation needs text')
    }
    const text = body.text.trim()
    const tone = checkText(body.tone, 'tone')
    const db = getDb()
    return db.begin(async tx => {
        const lines = await tx`
            select 1 from lines l join books b on b.id = l.book_id
            where l.id = ${lineId} and l.book_id = ${bookId} and l.family_id = ${familyId} and b.deleted_at is null
        `
        if (lines.length === 0) {
            return notFound('Line not found')
        }
        const changed = await tx`
            select 1 from line_translations
            where line_id = ${lineId} and language = ${language} and (text is distinct from ${text} or tone is distinct from ${tone})
        `
        const saved = one(await tx<ILineTranslation[]>`
            insert into line_translations (line_id, family_id, language, text, tone)
            values (${lineId}, ${familyId}, ${language}, ${text}, ${tone})
            on conflict (line_id, language) do update set text = excluded.text, tone = excluded.tone
            returning line_id, language, text, tone
        `)
        if (changed.length > 0) {
            await markLineRecordingsStale(tx, lineId, familyId, language)
        }
        return saved
    })
})
