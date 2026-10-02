import { MESSAGE_MAX_DURATION_MS } from '../../../shared/utils/voices'
import { getDb, one } from '../../utils/db'
import { assertFilesInFamily, assertMembersInFamily } from '../../utils/family'
import { actorEntry, record } from '../../utils/journal'
import { logEvent } from '../../utils/log'
import { purgeExpiredMessages } from '../../utils/messages'
import { requireActorMember, requirePermission } from '../../utils/permissions'
import { badRequest, isNonEmptyString } from '../../utils/validate'

const KINDS: MessageKind[] = ['NORMAL', 'BIRTHDAY']
const UNIQUE_VIOLATION = '23505'

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
    const [recipient] = await db<{ id: string; name: string }[]>`
        select id, name from members
        where id = ${body.toMemberId} and family_id = ${familyId} and role = 'child' and deleted_at is null and status = 'active' and source_member_id is null
    `
    if (!recipient) {
        return badRequest('A message goes to exactly one child')
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
    const refuseBusy = (): never => {
        throw createError({
            statusCode: 409,
            statusMessage: `Un message est déjà en attente pour ${recipient.name}. Attends qu’il soit écouté puis expiré.`,
        })
    }
    const [active] = await db<{ id: string }[]>`
        select id from messages where from_member_id = ${fromMemberId} and to_member_id = ${recipient.id} and kind = ${kind} and status = 'ACTIVE'
    `
    if (active) {
        refuseBusy()
    }
    let message: IMessage
    try {
        message = one(await db<IMessage[]>`
            insert into messages (family_id, from_member_id, to_member_id, file_id, mime, duration_ms, kind)
            values (${familyId}, ${fromMemberId}, ${recipient.id}, ${body.fileId}, ${body.mime}, ${durationMs}, ${kind})
            returning id, from_member_id, to_member_id, file_id, mime, duration_ms, kind, status, listened_at, first_listened_at, expires_at, created_at
        `)
    } catch (error) {
        if ((error as { code?: string }).code === UNIQUE_VIOLATION) {
            return refuseBusy()
        }
        throw error
    }
    await record(event, { ...actorEntry(actor), action: 'message.sent', entityType: 'message', entityId: message.id, targetMemberId: recipient.id, after: { kind, durationMs } })
    logEvent(`Message vocal envoyé (${message.durationMs} ms)`)
    return message
})
