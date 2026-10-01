import { getDb } from '../../utils/db'
import { requireFamily } from '../../utils/family'

export default defineEventHandler(async (event): Promise<IFeedback[]> => {
    const familyId = requireFamily(event)
    return getDb()<IFeedback[]>`
        select id, member_name, screen, mood, text, created_at from feedback
        where family_id = ${familyId} and deleted_at is null order by created_at desc limit 500
    `
})
