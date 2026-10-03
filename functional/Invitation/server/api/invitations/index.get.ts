import { getDb } from '~~/server/utils/db'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'

const MAX_INVITATIONS = 50

export default defineEventHandler(async (event): Promise<IInvitation[]> => {
    const { familyId } = await requirePermission(event, 'family.invite')
    return getDb()<IInvitation[]>`
        select id, code, channel, coalesce(contact, '') as contact, name, child_ids, expires_at, used_at, revoked_at, created_at
        from invitations where family_id = ${familyId} order by created_at desc limit ${MAX_INVITATIONS}
    `
})
