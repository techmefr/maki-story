import type { Sql, TransactionSql } from 'postgres'
import { deliverOutOfApp } from './delivery'
import { logEvent } from './log'

export interface INotificationInput {
    familyId: string
    recipientMemberId: string | null
    kind: NotificationKind
    payload: Record<string, string | number>
    groupKey?: string
    count?: number
}

export const notify = async (db: Sql | TransactionSql, input: INotificationInput): Promise<void> => {
    const recipient = input.recipientMemberId
    const count = input.count ?? 1
    if (input.groupKey !== undefined) {
        const merged = await db`
            update notifications
            set count = count + ${count}::int, payload = ${db.json(input.payload)}, updated_at = now()
            where family_id = ${input.familyId} and group_key = ${input.groupKey} and read_at is null
                and recipient_member_id is not distinct from ${recipient}
            returning id
        `
        if (merged.length > 0) {
            return
        }
    }
    await db`
        insert into notifications (family_id, recipient_member_id, kind, payload, group_key, count)
        values (${input.familyId}, ${recipient}, ${input.kind}, ${db.json(input.payload)}, ${input.groupKey ?? null}, ${count})
    `
    try {
        await deliverOutOfApp(db, { familyId: input.familyId, recipientMemberId: recipient, kind: input.kind, payload: input.payload, count })
    } catch (error) {
        logEvent(`Notification hors application impossible : ${(error as Error).message}`)
    }
}

export const notifyStale = async (db: Sql | TransactionSql, familyId: string, memberId: string, bookId: string, bookTitle: string, count: number): Promise<void> => {
    await notify(db, { familyId, recipientMemberId: memberId, kind: 'stale_takes', payload: { bookId, bookTitle }, groupKey: `stale:${bookId}:${memberId}`, count })
}
