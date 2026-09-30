import { getDb } from '../../utils/db'

export default defineEventHandler(async (): Promise<IFeedback[]> => {
    return getDb()<IFeedback[]>`
        select id, member_name, screen, mood, text, created_at from feedback order by created_at desc limit 500
    `
})
