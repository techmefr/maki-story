import { checkLanguage } from '../../../../../../utils/bookModel'
import { getDb } from '../../../../../../utils/db'
import { requireFamily } from '../../../../../../utils/family'
import { notFound, requireParam } from '../../../../../../utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const familyId = requireFamily(event)
    const bookId = requireParam(event, 'id')
    const lineId = requireParam(event, 'lineId')
    const language = checkLanguage(requireParam(event, 'language'))
    const removed = await getDb()`
        delete from line_translations
        where line_id = ${lineId} and language = ${language} and family_id = ${familyId}
          and line_id in (select id from lines where book_id = ${bookId})
        returning line_id
    `
    if (removed.length === 0) {
        return notFound('Translation not found')
    }
    return { ok: true }
})
