import { getDb } from './db'

export const PROFILE_SCOPE = ''

export const resolveLanguageConfig = async (memberId: string, familyId: string, bookId: string): Promise<ILanguageConfig | null> => {
    const [row] = await getDb()<{ languages: string[]; isLocked: boolean; bookId: string }[]>`
        select languages, is_locked, book_id from language_configs
        where member_id = ${memberId} and family_id = ${familyId} and book_id in (${bookId}, ${PROFILE_SCOPE})
        order by book_id desc limit 1
    `
    return row ? { languages: row.languages, isLocked: row.isLocked, scope: row.bookId === PROFILE_SCOPE ? 'profile' : 'book' } : null
}

export const loadPlaybackPlan = async (
    bookId: string,
    familyId: string,
    memberId: string | null,
    isChild: boolean,
    requested: string[] | null,
): Promise<IPlaybackPlan> => {
    const db = getDb()
    const [book] = await db<{ language: string }[]>`select language from books where id = ${bookId} and family_id = ${familyId}`
    const bookLanguage = book?.language ?? DEFAULT_LANGUAGE
    const lines = await db<IPlanLine[]>`
        select id, page_index, panel_id from lines where book_id = ${bookId} and family_id = ${familyId} order by position
    `
    const recordings = await db<IPlanRecording[]>`
        select r.line_id, r.language, r.file_id, r.duration_ms, r.member_id, r.status
        from ${isChild ? db`child_recordings` : db`recordings`} r join lines l on l.id = r.line_id
        where l.book_id = ${bookId} and r.family_id = ${familyId} and r.status <> 'stale'
    `
    const counts = new Map<string, number>()
    recordings.forEach(item => counts.set(item.language, (counts.get(item.language) ?? 0) + 1))
    const available = [...counts.entries()]
        .map(([code, recordedCount]): ILanguageAvailability => ({ code, recordedCount }))
        .sort((a, b) => Number(b.code === bookLanguage) - Number(a.code === bookLanguage) || b.recordedCount - a.recordedCount || a.code.localeCompare(b.code))
    const config = memberId ? await resolveLanguageConfig(memberId, familyId, bookId) : null
    const forced = isChild && config?.isLocked === true
    const chosen = forced ? config!.languages : (requested ?? config?.languages ?? null)
    const languages = chosen ?? (available.length === 1 ? [available[0]!.code] : null)
    const steps = languages ? buildPlaybackSteps(lines, recordings, languages, bookLanguage) : []
    return { bookId, bookLanguage, languages, available, config, steps }
}
