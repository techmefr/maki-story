import { getDb, one } from '../../../utils/db'
import { generateInviteCode } from '../../../utils/inviteCode'
import { logEvent } from '../../../utils/log'
import { requirePermission } from '../../../utils/permissions'

export default defineEventHandler(async (event): Promise<IFamilyInvite> => {
    const { familyId } = await requirePermission(event, 'family.invite')
    const invite = one(await getDb()<IFamilyInvite[]>`
        update families set invite_code = ${generateInviteCode()}, invite_revoked_at = null where id = ${familyId}
        returning invite_code as code, invite_revoked_at is not null as is_revoked
    `)
    logEvent('Code d’invitation renouvelé')
    return invite
})
