import type { TransactionSql } from 'postgres'

export const lockActiveConversation = async (tx: TransactionSql, senderId: string, recipientId: string): Promise<number> => {
    await tx`select pg_advisory_xact_lock(hashtext(${`${senderId}:${recipientId}`}))`
    const [row] = await tx<{ count: number }[]>`
        select count(*)::int as count from messages m
        where m.from_member_id = ${senderId} and m.to_member_id = ${recipientId}
            and m.status = 'ACTIVE' and m.deleted_at is null and (m.expires_at is null or m.expires_at > now())
            and not exists (select 1 from treasures t where t.source_message_id = m.id and t.deleted_at is null)
    `
    return row?.count ?? 0
}
