import { getDb } from '../../../utils/db'
import { requireMember, requireSession } from '../../../utils/family'
import { badRequest, notFound, requireParam } from '../../../utils/validate'

const readCount = (value: unknown): number => {
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 10_000_000) {
        return badRequest('Invalid progress')
    }
    return value
}

export default defineEventHandler(async (event): Promise<IPlaybackProgress> => {
    const { familyId } = requireSession(event)
    const memberId = requireMember(event)
    const bookId = requireParam(event, 'id')
    const body = await readBody<Partial<IPlaybackProgress>>(event)
    const progress: IPlaybackProgress = {
        pageIndex: readCount(body.pageIndex),
        lineIndex: readCount(body.lineIndex),
        positionMs: readCount(body.positionMs),
    }
    const db = getDb()
    const books = await db<{ id: string }[]>`select id from books where id = ${bookId} and family_id = ${familyId} and deleted_at is null`
    if (books.length === 0) {
        return notFound('Book not found')
    }
    await db`
        insert into playback_progress (member_id, book_id, family_id, page_index, line_index, position_ms)
        values (${memberId}, ${bookId}, ${familyId}, ${progress.pageIndex}, ${progress.lineIndex}, ${progress.positionMs})
        on conflict (member_id, book_id) do update
        set page_index = excluded.page_index, line_index = excluded.line_index,
            position_ms = excluded.position_ms, updated_at = now()
    `
    return progress
})
