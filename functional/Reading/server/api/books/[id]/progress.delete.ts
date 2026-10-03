import { getDb } from '~~/server/utils/db'
import { requireMember, requireSession } from '~~/server/utils/family'
import { requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const { familyId } = requireSession(event)
    const memberId = requireMember(event)
    const bookId = requireParam(event, 'id')
    await getDb()`delete from playback_progress where member_id = ${memberId} and book_id = ${bookId} and family_id = ${familyId}`
    return { ok: true }
})
