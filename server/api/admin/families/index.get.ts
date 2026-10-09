import { getDb } from '~~/server/utils/db'
import { requireInstanceAdmin } from '~~/server/utils/admin'

interface IAdminFamily {
    id: string
    name: string
    plan: string
    ownerEmail: string | null
    createdAt: string
}

export default defineEventHandler(async (event): Promise<IAdminFamily[]> => {
    await requireInstanceAdmin(event)
    return getDb()<IAdminFamily[]>`
        select f.id, f.name, f.plan, f.created_at,
            (select a.email from accounts a join account_families af on af.account_id = a.id where af.family_id = f.id order by a.created_at limit 1) as owner_email
        from families f
        where f.deleted_at is null
        order by f.created_at desc
    `
})
