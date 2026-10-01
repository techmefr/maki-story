import { getDb, one } from '../../utils/db'
import { assertFilesInFamily, assertMembersInFamily } from '../../utils/family'
import { logEvent } from '../../utils/log'
import { requireActorMember, requirePermission } from '../../utils/permissions'
import { badRequest, isNonEmptyString } from '../../utils/validate'

export default defineEventHandler(async (event): Promise<IMessage> => {
    const actor = await requirePermission(event, 'messages.send')
    const { familyId } = actor
    const body = await readBody<Partial<INewMessage>>(event)
    if (!isNonEmptyString(body.toMemberId) || !isNonEmptyString(body.fileId) || !isNonEmptyString(body.mime)) {
        return badRequest('Invalid message')
    }
    const fromMemberId = requireActorMember(actor)
    if (body.fromMemberId !== undefined && body.fromMemberId !== fromMemberId) {
        throw createError({ statusCode: 403, statusMessage: 'You can only send messages as yourself' })
    }
    if (body.toMemberId === fromMemberId) {
        return badRequest('Invalid message')
    }
    const db = getDb()
    await assertMembersInFamily(db, familyId, [fromMemberId, body.toMemberId])
    await assertFilesInFamily(db, familyId, [body.fileId])
    const [audio] = await db<{ id: string }[]>`
        select id from files where id = ${body.fileId} and family_id = ${familyId} and mime like 'audio/%' and octet_length(data) > 0
    `
    if (!audio || !(Number(body.durationMs) > 0)) {
        return badRequest('Only a recorded voice message can be sent')
    }
    const [recipient] = await db<{ id: string; role: MemberRole; name: string }[]>`
        select id, role, name from members where id = ${body.toMemberId} and family_id = ${familyId} and deleted_at is null and status = 'active' and source_member_id is null
    `
    if (!recipient) {
        return badRequest('This person cannot receive messages')
    }
    if (recipient.role === 'child' && actor.role !== 'child') {
        const [pending] = await db<{ total: number }[]>`
            select count(*)::int as total from messages
            where family_id = ${familyId} and from_member_id = ${fromMemberId} and to_member_id = ${recipient.id}
                and deleted_at is null and listened_at is null
        `
        if ((pending?.total ?? 0) >= MAX_STATUS_MESSAGES_PER_RELATIVE) {
            throw createError({
                statusCode: 409,
                statusMessage: `Il y a déjà ${MAX_STATUS_MESSAGES_PER_RELATIVE} messages en attente pour ${recipient.name}. Attends qu’ils soient écoutés.`,
            })
        }
    }
    if (actor.role !== 'parent') {
        const [owned] = await db<{ id: string }[]>`
            select id from files where id = ${body.fileId} and family_id = ${familyId} and created_by_member_id = ${fromMemberId}
        `
        if (!owned) {
            throw createError({ statusCode: 403, statusMessage: 'You can only send files you uploaded' })
        }
    }
    const message = one(await db<IMessage[]>`
        insert into messages (family_id, from_member_id, to_member_id, file_id, mime, duration_ms)
        values (${familyId}, ${fromMemberId}, ${body.toMemberId}, ${body.fileId}, ${body.mime}, ${Math.round(body.durationMs ?? 0)})
        returning id, from_member_id, to_member_id, file_id, mime, duration_ms, listened_at, created_at
    `)
    const stale = await db<{ id: string; fileId: string }[]>`
        select id, file_id from messages
        where family_id = ${familyId} and deleted_at is null and (
            (from_member_id = ${fromMemberId} and to_member_id = ${body.toMemberId})
            or (from_member_id = ${body.toMemberId} and to_member_id = ${fromMemberId})
        )
        order by created_at desc offset ${MAX_MESSAGES_PER_CONVERSATION}
    `
    if (stale.length > 0) {
        await db`update messages set deleted_at = now() where family_id = ${familyId} and id in ${db(stale.map(item => item.id))}`
    }
    logEvent(`Message vocal envoyé (${message.durationMs} ms)`)
    return message
})
