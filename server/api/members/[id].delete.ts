import { getDb, one } from '../../utils/db'
import { badRequest, requireParam } from '../../utils/validate'

export default defineEventHandler(async event => {
    const id = requireParam(event, 'id')
    const db = getDb()
    const { count } = one(await db<{ count: number }[]>`
        select count(*)::int as count from members where role = 'parent' and id <> ${id}
    `)
    if (count === 0) {
        return badRequest('At least one parent is required')
    }
    await db`delete from members where id = ${id}`
    await db`update lines set member_id = null, audio_file_id = null, audio_ms = 0 where member_id = ${id}`
    await db`delete from messages where from_member_id = ${id} or to_member_id = ${id}`
    return { ok: true }
})
