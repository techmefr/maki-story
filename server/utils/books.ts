import { getDb, one } from './db'
import { notFound } from './validate'

const SUMMARY_SELECT = `
    b.id, b.title, b.subtitle, b.author, b.age_min, b.age_max, b.language, b.type, b.tts_fallback,
    b.kind, b.solo_member_id, b.status, b.ai_generated, b.created_at,
    (select count(*)::int from book_pages p where p.book_id = b.id) as page_count,
    (select count(*)::int from lines l where l.book_id = b.id) as line_count,
    (select count(*)::int from lines l join recordings r on r.line_id = l.id and r.language = b.language and r.status <> 'stale'
        where l.book_id = b.id) as recorded_count,
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
    const pageRows = await db<Omit<IBookPage, 'panels'>[]>`
        select id, position, file_id, kind, tts_fallback, description from book_pages where book_id = ${id} and family_id = ${familyId} order by position
    `
    const panels = await db<IPanel[]>`
        select id, page_id, position, description from panels where book_id = ${id} and family_id = ${familyId} order by position
    `
    const pages: IBookPage[] = pageRows.map(page => ({ ...page, panels: panels.filter(panel => panel.pageId === page.id) }))
    const characters = await db<ICharacter[]>`
        select id, name, color, description, is_narrator, position from characters
        where book_id = ${id} and family_id = ${familyId} order by position, created_at
    `
    const lines = await db<ILine[]>`
        select l.id, l.position, l.page_index, coalesce(c.name, l.character) as character, l.character_id, l.panel_id,
            l.text, l.note, l.tone, l.scene_description, l.member_id,
            r.file_id as audio_file_id, coalesce(r.duration_ms, 0) as audio_ms, r.status as recording_status
        from lines l
        left join characters c on c.id = l.character_id
        left join recordings r on r.line_id = l.id and r.language = ${summary.language}
        where l.book_id = ${id} and l.family_id = ${familyId} order by l.position
    `
    const recordings = await db<ILineRecording[]>`
        select r.id, r.line_id, r.member_id, r.language, r.file_id, r.duration_ms, r.mime, r.status, r.created_at
        from recordings r join lines l on l.id = r.line_id
        where l.book_id = ${id} and r.family_id = ${familyId} order by r.created_at
    `
    const translations = await db<ILineTranslation[]>`
        select t.line_id, t.language, t.text, t.tone
        from line_translations t join lines l on l.id = t.line_id
        where l.book_id = ${id} and t.family_id = ${familyId} order by t.language
    `
    const voices = await db<{ memberId: string; tone: string }[]>`
        select member_id, tone from book_voices where book_id = ${id} and family_id = ${familyId}
    `
    const tones: Record<string, string> = {}
    voices.forEach(voice => {
        tones[voice.memberId] = voice.tone
    })
    return { ...summary, imageDesc, pages, characters, lines, recordings, translations, tones }
}
