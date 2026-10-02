import type { Sql, TransactionSql } from 'postgres'
import { MESSAGE_LISTEN_WINDOW_HOURS } from '../../shared/utils/voices'
import { record } from './journal'

type Db = Sql | TransactionSql

export const MESSAGE_COLUMNS = `m.id, m.from_member_id, m.to_member_id, m.file_id, m.mime, m.duration_ms, m.kind, m.status, m.listened_at, m.first_listened_at, m.expires_at, m.created_at`

export const purgeExpiredMessages = async (db: Db, familyId: string | null = null): Promise<{ expired: number; filesDeleted: number }> => {
    const expired = await db<{ id: string; familyId: string }[]>`
        update messages set status = 'EXPIRED'
        where status = 'ACTIVE' and expires_at is not null and expires_at <= now() and (${familyId}::text is null or family_id = ${familyId})
        returning id, family_id
    `
    const files = await db<{ id: string }[]>`
        delete from files f
        where (${familyId}::text is null or f.family_id = ${familyId})
            and exists (select 1 from messages m where m.file_id = f.id and m.status = 'EXPIRED')
            and not exists (select 1 from messages m where m.file_id = f.id and m.status <> 'EXPIRED')
            and not exists (select 1 from treasures t where t.file_id = f.id)
        returning f.id
    `
    for (const row of expired) {
        await record(null, { familyId: row.familyId, action: 'message.purged', entityType: 'message', entityId: row.id }, db)
    }
    return { expired: expired.length, filesDeleted: files.length }
}

export const listenWindowSql = `now() + interval '${MESSAGE_LISTEN_WINDOW_HOURS} hours'`
