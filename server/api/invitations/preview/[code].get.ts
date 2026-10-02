import { getDb } from '../../../utils/db'
import { findInvitation } from '../../../utils/invitations'
import { normalizeInviteCode } from '../../../utils/inviteCode'
import { assertIpBudget, recordIpHit } from '../../../utils/throttle'
import { requireParam } from '../../../utils/validate'

const PREVIEWS_PER_WINDOW = 60

export default defineEventHandler(async (event): Promise<IInvitationPreview> => {
    await assertIpBudget(event, 'invite-preview', PREVIEWS_PER_WINDOW)
    await recordIpHit(event, 'invite-preview')
    const invitation = await findInvitation(getDb(), normalizeInviteCode(requireParam(event, 'code')))
    if (!invitation || !invitation.isUsable) {
        return { familyName: '', inviterName: '', isUsable: false }
    }
    return { familyName: invitation.familyName, inviterName: invitation.inviterName, isUsable: true }
})
