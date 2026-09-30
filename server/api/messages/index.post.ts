import { deleteFiles } from '../../utils/books'
import { getDb } from '../../utils/db'
import { badRequest, isNonEmptyString } from '../../utils/validate'

export default defineEventHandler(async (event): Promise<IMessage> => {
    const body = await readBody<Partial<INewMessage>>(event)
    if (
        !isNonEmptyString(body.fromMemberId) ||
        !isNonEmptyString(body.toMemberId) ||
        !isNonEmptyString(body.fileId) ||
        !isNonEmptyString(body.mime) ||
        body.fromMemberId === body.toMemberId
    ) {
        return badRequest('Invalid message')
    }
    const db = getDb()
    const [message] = await db<IMessage[]>`
        insert into messages (from_member_id, to_member_id, file_id, mime, duration_ms)
        values (${body.fromMemberId}, ${body.toMemberId}, ${body.fileId}, ${body.mime}, ${Math.round(body.durationMs ?? 0)})
        returning id, from_member_id, to_member_id, file_id, mime, duration_ms, listened_at, created_at
    `
    const stale = await db<{ id: string; fileId: string }[]>`
        select id, file_id from messages
        where (from_member_id = ${body.fromMemberId} and to_member_id = ${body.toMemberId})
           or (from_member_id = ${body.toMemberId} and to_member_id = ${body.fromMemberId})
        order by created_at desc offset ${MAX_MESSAGES_PER_CONVERSATION}
    `
    if (stale.length > 0) {
        await db`delete from messages where id in ${db(stale.map(item => item.id))}`
        await deleteFiles(stale.map(item => item.fileId))
    }
    return message
})
