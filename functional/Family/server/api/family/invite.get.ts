import { getDb, one } from '~~/server/utils/db'
import { requirePermission } from '~~/server/utils/permissions'

export default defineEventHandler(async (event): Promise<IFamilyInvite> => {
    const { familyId } = await requirePermission(event, 'family.invite')
    return one(await getDb()<IFamilyInvite[]>`
        select invite_code as code, invite_revoked_at is not null as is_revoked from families where id = ${familyId}
    `)
})
