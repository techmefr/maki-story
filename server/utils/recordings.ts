import type { Sql, TransactionSql } from 'postgres'
import { notifyStale } from './notifications'
import { isRecordingDurationValid, isRecordingMimeValid } from '../../shared/utils/recording'

export const preserveApprovedTake = async (db: Sql | TransactionSql, lineId: string, familyId: string, language: string): Promise<void> => {
    await db`
        insert into approved_takes (id, family_id, line_id, member_id, language, file_id, duration_ms, mime, created_at)
        select id, family_id, line_id, member_id, language, file_id, duration_ms, mime, created_at from recordings
        where line_id = ${lineId} and family_id = ${familyId} and language = ${language} and status = 'approved'
        on conflict (line_id, language) do nothing
    `
}

export const dropApprovedTake = async (db: Sql | TransactionSql, lineId: string, familyId: string, language: string | null = null): Promise<void> => {
    await db`
        delete from approved_takes
        where line_id = ${lineId} and family_id = ${familyId} and (${language}::text is null or language = ${language}::text)
    `
}

export const markLineRecordingsStale = async (
    db: Sql | TransactionSql,
    lineId: string,
    familyId: string,
    language: string | null,
    actorMemberId: string | null = null,
): Promise<number> => {
    const rows = await db<{ id: string; memberId: string; bookId: string; bookTitle: string }[]>`
        update recordings r set status = 'stale'
        from lines l join books b on b.id = l.book_id
        where l.id = r.line_id and r.line_id = ${lineId} and r.family_id = ${familyId}
            and (${language}::text is null or r.language = ${language}::text) and r.status <> 'stale'
        returning r.id, r.member_id, l.book_id, b.title as book_title
    `
    await dropApprovedTake(db, lineId, familyId, language)
    const perVoice = new Map<string, { memberId: string; bookId: string; bookTitle: string; count: number }>()
    for (const row of rows) {
        await db`
            insert into book_activity (family_id, book_id, line_id, actor_member_id, subject_member_id, kind)
            values (${familyId}, ${row.bookId}, ${lineId}, ${actorMemberId}, ${row.memberId}, 'stale')
        `
        const key = `${row.memberId}:${row.bookId}`
        perVoice.set(key, { memberId: row.memberId, bookId: row.bookId, bookTitle: row.bookTitle, count: (perVoice.get(key)?.count ?? 0) + 1 })
    }
    for (const entry of perVoice.values()) {
        if (entry.memberId !== actorMemberId) {
            await notifyStale(db, familyId, entry.memberId, entry.bookId, entry.bookTitle, entry.count)
        }
    }
    return rows.length
}

export const assertRecordingAcceptable = (mime: string, ms: unknown): number => {
    if (!isRecordingMimeValid(mime)) {
        throw createError({ statusCode: 400, statusMessage: 'Unsupported recording type' })
    }
    const duration = typeof ms === 'number' ? Math.round(ms) : 0
    if (!isRecordingDurationValid(duration)) {
        throw createError({ statusCode: 400, statusMessage: 'Recording is too long' })
    }
    return duration
}

export const assertSpokenLanguage = async (db: Sql | TransactionSql, memberId: string, language: string): Promise<void> => {
    const [member] = await db<{ spokenLanguages: string[] }[]>`select spoken_languages from members where id = ${memberId}`
    if (member && member.spokenLanguages.length > 0 && !member.spokenLanguages.includes(language)) {
        throw createError({ statusCode: 400, statusMessage: 'This language is not one of your spoken languages' })
    }
}
