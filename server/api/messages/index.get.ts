import { getDb } from '../../utils/db'

export default defineEventHandler(async (): Promise<IMessage[]> => {
    return getDb()<IMessage[]>`
        select id, from_member_id, to_member_id, file_id, mime, duration_ms, listened_at, created_at
        from messages where deleted_at is null order by created_at desc
    `
})
