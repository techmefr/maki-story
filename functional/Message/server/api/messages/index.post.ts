import { MESSAGE_MAX_ACTIVE, MESSAGE_MAX_DURATION_MS } from '~~/shared/utils/voices'
import { getDb, one } from '~~/server/utils/db'
import { assertFilesInFamily, assertMembersInFamily } from '~~/server/utils/family'
import { actorEntry, record } from '~~/server/utils/journal'
import { logEvent } from '~~/server/utils/log'
import { purgeExpiredMessages } from '~~/server/utils/messages'
import { assertChildConcerned } from '~~/server/utils/memberships'
import { notify } from '~~/server/utils/notifications'
import { requireActorMember, requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { badRequest, isNonEmptyString } from '~~/server/utils/validate'

const KINDS: MessageKind[] = ['NORMAL', 'BIRTHDAY']

export default defineEventHandler(async (event): Promise<IMessage> => {
    const actor = await requirePermission(event, 'messages.send')
    const { familyId } = actor
    const body = await readBody<Partial<INewMessage>>(event)
    if (!isNonEmptyString(body.toMemberId) || !isNonEmptyString(body.fileId) || !isNonEmptyString(body.mime)) {
        return badRequest('Invalid message')
    }
    if (body.kind !== undefined && !KINDS.includes(body.kind)) {
        return badRequest('Invalid message kind')
    }
    const kind: MessageKind = body.kind ?? 'NORMAL'
    const fromMemberId = requireActorMember(actor)
    if (body.fromMemberId !== undefined && body.fromMemberId !== fromMemberId) {
        throw createError({ statusCode: 403, statusMessage: 'You can only send messages as yourself' })
    }
    const db = getDb()
    await assertMembersInFamily(db, familyId, [fromMemberId, body.toMemberId])
    await assertFilesInFamily(db, familyId, [body.fileId])
    const [audio] = await db<{ id: string }[]>`
        select id from files where id = ${body.fileId} and family_id = ${familyId} and mime like 'audio/%' and octet_length(data) > 0
    `
    const durationMs = Math.round(Number(body.durationMs))
    if (!audio || !(durationMs > 0)) {
        return badRequest('Only a recorded voice message can be sent')
    }
    if (durationMs > MESSAGE_MAX_DURATION_MS) {
        return badRequest('This message is too long')
    }
    const recipientRole = actor.role === 'child' ? `role <> 'child'` : `role = 'child'`
    const [recipient] = await db<{ id: string; name: string }[]>`
        select id, name from members
        where id = ${body.toMemberId} and family_id = ${familyId} and ${db.unsafe(recipientRole)} and deleted_at is null and status = 'active' and source_member_id is null
    `
    if (!recipient || recipient.id === fromMemberId) {
        return badRequest(actor.role === 'child' ? 'A child writes to an adult of the family' : 'A message goes to exactly one child')
    }
    if (actor.role !== 'child') {
        await assertChildConcerned(db, actor.accountId, familyId, actor.role, recipient.id)
    }
    if (actor.role !== 'parent') {
        const [owned] = await db<{ id: string }[]>`
            select id from files where id = ${body.fileId} and family_id = ${familyId} and created_by_member_id = ${fromMemberId}
        `
        if (!owned) {
            throw createError({ statusCode: 403, statusMessage: 'You can only send files you uploaded' })
        }
    }
    await purgeExpiredMessages(db, familyId)
    const message = await db.begin(async tx => {
        await tx`select pg_advisory_xact_lock(hashtext(${`${fromMemberId}:${recipient.id}`}))`
        const [{ count }] = await tx<{ count: number }[]>`
            select count(*)::int as count from messages m
            where m.from_member_id = ${fromMemberId} and m.to_member_id = ${recipient.id} and m.status = 'ACTIVE' and m.deleted_at is null
                and not exists (select 1 from treasures t where t.source_message_id = m.id and t.deleted_at is null)
        `
        if (count >= MESSAGE_MAX_ACTIVE) {
            throw createError({
                statusCode: 409,
                statusMessage: `Tu as déjà ${MESSAGE_MAX_ACTIVE} messages en attente pour ${recipient.name}. Ils disparaissent 24 h après leur première écoute.`,
            })
        }
        return one(await tx<IMessage[]>`
            insert into messages (family_id, from_member_id, to_member_id, file_id, mime, duration_ms, kind)
            values (${familyId}, ${fromMemberId}, ${recipient.id}, ${body.fileId}, ${body.mime}, ${durationMs}, ${kind})
            returning id, from_member_id, to_member_id, file_id, mime, duration_ms, kind, status, listened_at, first_listened_at, expires_at, created_at
        `)
    })
    const [sender] = await db<{ name: string }[]>`select name from members where id = ${fromMemberId}`
    const payload = { fromName: sender?.name ?? '', childName: recipient.name, messageId: message.id }
    await notify(db, { familyId, recipientMemberId: recipient.id, kind: 'message_received', payload })
    if (actor.role === 'relative') {
        await notify(db, { familyId, recipientMemberId: null, kind: 'message_received', payload })
    }
    await record(event, { ...actorEntry(actor), action: 'message.sent', entityType: 'message', entityId: message.id, targetMemberId: recipient.id, after: { kind, durationMs } })
    logEvent(`Message vocal envoyé (${message.durationMs} ms)`)
    return message
})
