import type { Sql } from 'postgres'

export interface IAuditEntry {
    familyId: string
    actorId: string | null
    targetId: string | null
    action: string
    details?: Record<string, unknown>
}

export const writeAudit = async (db: Sql, entry: IAuditEntry): Promise<void> => {
    await db`
        insert into audit_log (family_id, actor_member_id, target_member_id, action, details)
        values (${entry.familyId}, ${entry.actorId}, ${entry.targetId}, ${entry.action}, ${db.json((entry.details ?? {}) as never)})
    `
}
