import { getDb, one } from './db'
import { notFound } from './validate'

const SUMMARY_SELECT = `
    b.id, b.title, b.kind, b.solo_member_id, b.status, b.created_at,
    (select count(*)::int from book_pages p where p.book_id = b.id) as page_count,
    (select count(*)::int from lines l where l.book_id = b.id) as line_count,
    (select count(*)::int from lines l where l.book_id = b.id and l.audio_file_id is not null) as recorded_count,
    coalesce((select array_agg(distinct l.member_id) from lines l where l.book_id = b.id and l.member_id is not null), '{}') as member_ids
`

export const listBookSummaries = async (familyId: string): Promise<IBookSummary[]> => {
    return getDb().unsafe<IBookSummary[]>(
        `select ${SUMMARY_SELECT} from books b where b.family_id = $1 and b.deleted_at is null order by b.created_at desc`,
        [familyId],
    )
}

export const loadBook = async (id: string, familyId: string): Promise<IBook> => {
    const db = getDb()
    const [summary] = await db.unsafe<IBookSummary[]>(
        `select ${SUMMARY_SELECT} from books b where b.id = $1 and b.family_id = $2 and b.deleted_at is null`,
        [id, familyId],
    )
    if (!summary) {
        return notFound('Book not found')
    }
    const { imageDesc } = one(await db<{ imageDesc: string }[]>`select image_desc from books where id = ${id} and family_id = ${familyId}`)
    const pages = await db<IBookPage[]>`
        select id, position, file_id from book_pages where book_id = ${id} and family_id = ${familyId} order by position
    `
    const lines = await db<ILine[]>`
        select id, position, page_index, character, text, note, member_id, audio_file_id, audio_ms
        from lines where book_id = ${id} and family_id = ${familyId} order by position
    `
    const voices = await db<{ memberId: string; tone: string }[]>`
        select member_id, tone from book_voices where book_id = ${id} and family_id = ${familyId}
    `
    const tones: Record<string, string> = {}
    voices.forEach(voice => {
        tones[voice.memberId] = voice.tone
    })
    return { ...summary, imageDesc, pages, lines, tones }
}
