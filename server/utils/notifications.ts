import type { Sql, TransactionSql } from 'postgres'

export interface INotificationInput {
    familyId: string
    recipientMemberId: string | null
    kind: NotificationKind
    payload: Record<string, string | number>
    groupKey?: string
}

export const notify = async (db: Sql | TransactionSql, input: INotificationInput): Promise<void> => {
    const recipient = input.recipientMemberId
    if (input.groupKey !== undefined) {
        const merged = await db`
            update notifications
            set count = count + 1, payload = ${db.json(input.payload)}, updated_at = now()
            where family_id = ${input.familyId} and group_key = ${input.groupKey} and read_at is null
                and recipient_member_id is not distinct from ${recipient}
            returning id
        `
        if (merged.length > 0) {
            return
        }
    }
    await db`
        insert into notifications (family_id, recipient_member_id, kind, payload, group_key)
        values (${input.familyId}, ${recipient}, ${input.kind}, ${db.json(input.payload)}, ${input.groupKey ?? null})
    `
}
