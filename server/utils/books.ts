import { getDb, one } from './db'
import type { IActor } from './permissions'
import { notFound } from './validate'

export const BLOCKED_VOICE = `(bm.status = 'blocked' or (bm.status in ('left', 'deceased') and bm.voice_policy in ('block', 'rerecord')))`

const BLOCKED_FROM = `from lines bl
    join recordings br on br.line_id = bl.id and br.status <> 'stale'
    join members bm on bm.id = br.member_id
    where bl.book_id = b.id and ${BLOCKED_VOICE}`

const SUMMARY_SELECT = `
    b.id, b.title, b.subtitle, b.author, coalesce(b.illustrator, '') as illustrator, b.age_min, b.age_max, b.language, b.written_language, b.voice_languages, b.moods, b.themes, b.type, b.tts_fallback,
    b.kind, b.solo_member_id, b.status, b.ai_generated, b.created_at,
    (select count(*)::int from book_pages p where p.book_id = b.id) as page_count,
    (select count(*)::int from lines l where l.book_id = b.id) as line_count,
    (select count(*)::int from lines l join recordings r on r.line_id = l.id and r.language = b.language and r.status <> 'stale'
        where l.book_id = b.id) as recorded_count,
    (select count(*)::int from lines l join recordings r on r.line_id = l.id and r.status = 'submitted' where l.book_id = b.id) as submitted_count,
    (select count(*)::int from lines l join recordings r on r.line_id = l.id and r.status = 'changes_requested' where l.book_id = b.id) as changes_requested_count,
    coalesce((select array_agg(distinct l.member_id) from lines l where l.book_id = b.id and l.member_id is not null), '{}') as member_ids,
    coalesce((select array_agg(distinct r.member_id) from lines l join recordings r on r.line_id = l.id and r.status <> 'stale' where l.book_id = b.id), '{}') as reader_ids,
    exists (select 1 ${BLOCKED_FROM}) as is_voice_blocked,
    (select count(distinct bl.id)::int ${BLOCKED_FROM}) as blocked_line_count
`

const CHILD_SCOPE = `b.status = 'ready' and exists (select 1 from lines sl join child_recordings sr on sr.line_id = sl.id where sl.book_id = b.id)
    and not exists (select 1 ${BLOCKED_FROM})`

const MAX_PAGE_SIZE = 200
const LIKE_SPECIALS = /[\\%_]/g

const readText = (value: unknown): string | undefined => (typeof value === 'string' && value.trim() !== '' ? value.trim().slice(0, 80) : undefined)

const readCount = (value: unknown, fallback: number, max: number): number => {
    const parsed = Number.parseInt(String(value ?? ''), 10)
    return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, max) : fallback
}

export const parseBookQuery = (raw: Record<string, unknown>): IBookQuery => ({
    q: readText(raw.q),
    language: readText(raw.language),
    age: readText(raw.age),
    limit: Math.max(1, readCount(raw.limit, MAX_PAGE_SIZE, MAX_PAGE_SIZE)),
    offset: readCount(raw.offset, 0, 100000),
})

export const bookScope = (actor: IActor, memberParam: number): string => {
    if (actor.role === 'parent') {
        return 'true'
    }
    if (actor.role === 'child') {
        return CHILD_SCOPE
    }
    return `exists (select 1 from lines sl where sl.book_id = b.id and sl.member_id = $${memberParam})`
}

export const bookScopeParams = (actor: IActor): string[] => (actor.role === 'relative' && actor.memberId ? [actor.memberId] : [])

export const listBookSummaries = async (actor: IActor, query: IBookQuery = {}): Promise<IBookList> => {
    const params: string[] = [actor.familyId, ...bookScopeParams(actor)]
    const filters: string[] = []
    const bind = (value: string | number): string => {
        params.push(String(value))
        return `$${params.length}`
    }
    if (query.q) {
        const needle = bind(`%${query.q.replace(LIKE_SPECIALS, match => `\\${match}`)}%`)
        filters.push(`(b.title ilike ${needle} or b.subtitle ilike ${needle} or b.author ilike ${needle} or b.illustrator ilike ${needle})`)
    }
    if (query.language) {
        filters.push(`b.language = ${bind(query.language)}`)
    }
    const tag = AGE_TAGS.find(item => item.id === query.age)
    if (tag) {
        filters.push(`b.age_min is not null and b.age_min <= ${bind(tag.max)}::int and coalesce(b.age_max, b.age_min) >= ${bind(tag.min)}::int`)
    }
    const where = `b.family_id = $1 and b.deleted_at is null and ${bookScope(actor, 2)}${filters.map(item => ` and ${item}`).join('')}`
    const filterParams = [...params]
    const limit = bind(query.limit ?? MAX_PAGE_SIZE)
    const offset = bind(query.offset ?? 0)
    const db = getDb()
    const items = await db.unsafe<IBookSummary[]>(
        `select ${SUMMARY_SELECT} from books b where ${where} order by b.created_at desc limit ${limit}::int offset ${offset}::int`,
        params,
    )
    const [counted] = await db.unsafe<{ total: number }[]>(`select count(*)::int as total from books b where ${where}`, filterParams)
    return { items, total: counted?.total ?? 0 }
}

export const assertBookReadable = async (actor: IActor, bookId: string): Promise<void> => {
    const rows = await getDb().unsafe(
        `select 1 from books b where b.id = $1 and b.family_id = $2 and b.deleted_at is null and ${bookScope(actor, 3)}`,
        [bookId, actor.familyId, ...bookScopeParams(actor)],
    )
    if (rows.length === 0) {
        notFound('Book not found')
    }
}

export const loadBook = async (id: string, familyId: string, approvedOnly = false, hideScans = approvedOnly): Promise<IBook> => {
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
    const pages: IBookPage[] = pageRows.map(page => ({ ...page, fileId: hideScans ? null : page.fileId, panels: panels.filter(panel => panel.pageId === page.id) }))
    const characters = await db<ICharacter[]>`
        select id, name, color, description, is_narrator, position from characters
        where book_id = ${id} and family_id = ${familyId} order by position, created_at
    `
    const lines = await db<ILine[]>`
        select l.id, l.position, l.page_index, coalesce(c.name, l.character) as character, l.character_id, l.panel_id,
            l.text, l.note, l.tone, l.scene_description, l.member_id,
            r.file_id as audio_file_id, coalesce(r.duration_ms, 0) as audio_ms, r.status as recording_status,
            coalesce(r.status <> 'stale' and (bm.status = 'blocked' or (bm.status in ('left', 'deceased') and bm.voice_policy in ('block', 'rerecord'))), false) as is_voice_blocked
        from lines l
        left join characters c on c.id = l.character_id
        left join ${approvedOnly ? db`child_recordings` : db`recordings`} r on r.line_id = l.id and r.language = ${summary.language}
        left join members bm on bm.id = r.member_id
        where l.book_id = ${id} and l.family_id = ${familyId} order by l.position
    `
    const recordings = await db<ILineRecording[]>`
        select r.id, r.line_id, r.member_id, r.language, r.file_id, r.duration_ms, r.mime, r.status, r.created_at
        from ${approvedOnly ? db`child_recordings` : db`recordings`} r join lines l on l.id = r.line_id
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
