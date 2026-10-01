import { getDb } from '../../../utils/db'
import { requireParentMember } from '../../../utils/ai/jobs'
import { loadBook } from '../../../utils/books'
import { notFound, requireParam } from '../../../utils/validate'

export default defineEventHandler(async (event): Promise<IBook> => {
    const { familyId } = await requireParentMember(event)
    const id = requireParam(event, 'id')
    const rows = await getDb()<{ id: string }[]>`
        update books set status = ${'to_record'} where id = ${id} and family_id = ${familyId} and deleted_at is null and ai_generated and status = ${'draft'}
        returning id
    `
    if (rows.length === 0) {
        return notFound('Draft not found')
    }
    return loadBook(id, familyId)
})
