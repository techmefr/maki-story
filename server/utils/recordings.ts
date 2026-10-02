import type { Sql, TransactionSql } from 'postgres'
import { isRecordingDurationValid, isRecordingMimeValid } from '../../shared/utils/recording'

export const markLineRecordingsStale = async (
    db: Sql | TransactionSql,
    lineId: string,
    familyId: string,
    language: string,
    actorMemberId: string | null = null,
): Promise<number> => {
    const rows = await db<{ id: string; memberId: string; bookId: string }[]>`
        update recordings r set status = 'stale'
        from lines l
        where l.id = r.line_id and r.line_id = ${lineId} and r.family_id = ${familyId} and r.language = ${language} and r.status <> 'stale'
        returning r.id, r.member_id, l.book_id
    `
    for (const row of rows) {
        await db`
            insert into book_activity (family_id, book_id, line_id, actor_member_id, subject_member_id, kind)
            values (${familyId}, ${row.bookId}, ${lineId}, ${actorMemberId}, ${row.memberId}, 'stale')
        `
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
