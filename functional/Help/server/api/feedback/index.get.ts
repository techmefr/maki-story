import { getDb } from '~~/server/utils/db'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'

export default defineEventHandler(async (event): Promise<IFeedback[]> => {
    const { familyId } = await requirePermission(event, 'feedback.manage')
    return getDb()<IFeedback[]>`
        select id, member_name, screen, mood, text, created_at from feedback
        where family_id = ${familyId} and deleted_at is null order by created_at desc limit 500
    `
})
