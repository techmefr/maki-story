import type { Sql, TransactionSql } from 'postgres'

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
    language: string,
    actorMemberId: string | null = null,
): Promise<number> => {
    const rows = await db<{ id: string; memberId: string; bookId: string }[]>`
        update recordings r set status = 'stale'
        from lines l
        where l.id = r.line_id and r.line_id = ${lineId} and r.family_id = ${familyId} and r.language = ${language} and r.status <> 'stale'
        returning r.id, r.member_id, l.book_id
    `
    await dropApprovedTake(db, lineId, familyId, language)
    for (const row of rows) {
        await db`
            insert into book_activity (family_id, book_id, line_id, actor_member_id, subject_member_id, kind)
            values (${familyId}, ${row.bookId}, ${lineId}, ${actorMemberId}, ${row.memberId}, 'stale')
        `
    }
    return rows.length
}
