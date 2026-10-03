import { ACTIVITY_PAGE_LIMIT, MAX_ACTIVITY_PAGE_LIMIT } from '~~/shared/utils/retention'
import { getDb } from '~~/server/utils/db'
import { requirePermission } from '~~/server/utils/permissions'

const readCount = (value: unknown, fallback: number, max: number): number => {
    const parsed = Number.parseInt(String(value ?? ''), 10)
    return Number.isFinite(parsed) && parsed >= 0 ? Math.min(parsed, max) : fallback
}

export default defineEventHandler(async (event): Promise<IActivityPage> => {
    const actor = await requirePermission(event, 'family.activity')
    const query = getQuery(event)
    const limit = Math.max(1, readCount(query.limit, ACTIVITY_PAGE_LIMIT, MAX_ACTIVITY_PAGE_LIMIT))
    const offset = readCount(query.offset, 0, 100000)
    const db = getDb()
    const items = await db<IActivityEntry[]>`
        select a.id, a.action, a.entity_type, a.entity_id, m.name as actor_name, a.outcome, a.created_at
        from audit_log a left join members m on m.id = a.actor_member_id and m.family_id = a.family_id
        where a.family_id = ${actor.familyId}
        order by a.created_at desc, a.id desc limit ${limit} offset ${offset}
    `
    const [counted] = await db<{ total: number }[]>`select count(*)::int as total from audit_log where family_id = ${actor.familyId}`
    return { items, total: counted?.total ?? 0 }
})
