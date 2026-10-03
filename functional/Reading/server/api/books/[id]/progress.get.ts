import { getDb } from '~~/server/utils/db'
import { requireMember, requireSession } from '~~/server/utils/family'
import { requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<IPlaybackProgress | null> => {
    const { familyId } = requireSession(event)
    const memberId = requireMember(event)
    const bookId = requireParam(event, 'id')
    const rows = await getDb()<{ pageIndex: number; lineIndex: number; positionMs: number }[]>`
        select page_index as "pageIndex", line_index as "lineIndex", position_ms as "positionMs"
        from playback_progress
        where member_id = ${memberId} and book_id = ${bookId} and family_id = ${familyId}
    `
    return rows[0] ?? null
})
