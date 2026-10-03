import { getDb } from '~~/server/utils/db'
import { findInvitation } from '~~/server/utils/invitations'
import { normalizeInviteCode } from '~~/server/utils/inviteCode'
import { assertIpBudget, recordIpHit } from '~~/technical/Auth/server/utils/throttle'
import { requireParam } from '~~/server/utils/validate'

const PREVIEWS_PER_WINDOW = 60

export default defineEventHandler(async (event): Promise<IInvitationPreview> => {
    await assertIpBudget(event, 'invite-preview', PREVIEWS_PER_WINDOW)
    await recordIpHit(event, 'invite-preview')
    const invitation = await findInvitation(getDb(), normalizeInviteCode(requireParam(event, 'code')))
    if (!invitation || !invitation.isUsable) {
        return { familyName: '', inviterName: '', role: 'relative', isUsable: false }
    }
    return { familyName: invitation.familyName, inviterName: invitation.inviterName, role: invitation.role, isUsable: true }
})
