import { getDb } from '../../utils/db'
import { requireActor } from '../../utils/profile-code'

export default defineEventHandler(async (event): Promise<IDevice[]> => {
    const actor = await requireActor(event)
    return getDb()<IDevice[]>`
        select d.id, d.member_id, m.name as member_name, d.label, d.created_at, d.last_used_at
        from member_devices d join members m on m.id = d.member_id
        where d.family_id = ${actor.familyId} and d.revoked_at is null and m.deleted_at is null
            and (${actor.role === 'parent'} or d.member_id = ${actor.id})
        order by d.created_at
    `
})
