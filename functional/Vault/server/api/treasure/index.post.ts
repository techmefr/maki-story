import { getDb, one } from '~~/server/utils/db'
import { actorEntry, record } from '~~/server/utils/journal'
import { purgeExpiredMessages } from '~~/server/utils/messages'
import { requireActorMember, requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { badRequest, isNonEmptyString, notFound } from '~~/server/utils/validate'

const UNIQUE_VIOLATION = '23505'
const CHECK_VIOLATION = '23514'

interface ISourceMessage {
    id: string
    fromMemberId: string
    toMemberId: string
    fileId: string
    mime: string
    durationMs: number
}

export default defineEventHandler(async (event): Promise<ITreasure> => {
    const actor = await requirePermission(event, 'treasure.save')
    const savedBy = requireActorMember(actor)
    const body = await readBody<{ messageId?: string }>(event)
    if (!isNonEmptyString(body.messageId)) {
        return badRequest('Invalid message')
    }
    const db = getDb()
    await purgeExpiredMessages(db, actor.familyId)
    const [source] = await db<ISourceMessage[]>`
        select id, from_member_id, to_member_id, file_id, mime, duration_ms from messages
        where id = ${body.messageId} and family_id = ${actor.familyId} and deleted_at is null and status = 'ACTIVE'
            and (expires_at is null or expires_at > now())
    `
    if (!source || (actor.role !== 'parent' && source.toMemberId !== savedBy)) {
        return notFound('Message not found')
    }
    const [existing] = await db<ITreasure[]>`
        select id, child_id, source_message_id, from_member_id, file_id, mime, duration_ms, saved_by_member_id, created_at
        from treasures where child_id = ${source.toMemberId} and source_message_id = ${source.id} and deleted_at is null
    `
    if (existing) {
        return existing
    }
    try {
        const saved = await db.begin(async tx => {
            const copy = one(await tx<{ id: string }[]>`
                insert into files (mime, data, family_id, created_by_member_id)
                select mime, data, family_id, created_by_member_id from files where id = ${source.fileId} and family_id = ${actor.familyId}
                returning id
            `)
            return one(await tx<ITreasure[]>`
                insert into treasures (family_id, child_id, source_message_id, from_member_id, file_id, mime, duration_ms, saved_by_member_id)
                values (${actor.familyId}, ${source.toMemberId}, ${source.id}, ${source.fromMemberId}, ${copy.id}, ${source.mime}, ${source.durationMs}, ${savedBy})
                returning id, child_id, source_message_id, from_member_id, file_id, mime, duration_ms, saved_by_member_id, created_at
            `)
        })
        await record(event, { ...actorEntry(actor), action: 'treasure.saved', entityType: 'treasure', entityId: saved.id, targetMemberId: source.toMemberId })
        return saved
    } catch (error) {
        const code = (error as { code?: string }).code
        if (code === CHECK_VIOLATION) {
            throw createError({ statusCode: 409, statusMessage: 'The treasure box is full' })
        }
        if (code === UNIQUE_VIOLATION) {
            throw createError({ statusCode: 409, statusMessage: 'This message is already in the treasure box' })
        }
        throw error
    }
})
