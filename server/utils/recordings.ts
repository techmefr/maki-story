import type { Sql, TransactionSql } from 'postgres'

export const markLineRecordingsStale = async (db: Sql | TransactionSql, lineId: string, familyId: string, language: string): Promise<number> => {
    const rows = await db`
        update recordings set status = 'stale'
        where line_id = ${lineId} and family_id = ${familyId} and language = ${language} and status <> 'stale'
        returning id
    `
    return rows.length
}
