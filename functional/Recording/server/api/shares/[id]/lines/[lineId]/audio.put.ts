import { isVoiceBlocked } from '~~/shared/utils/blocking'
import { checkLanguage } from '~~/server/utils/bookModel'
import { getDb } from '~~/server/utils/db'
import { assertFilesInFamily } from '~~/server/utils/family'
import { actorEntry, record } from '~~/server/utils/journal'
import { logEvent } from '~~/server/utils/log'
import { assertSpokenLanguage, preserveApprovedTake } from '~~/server/utils/recordings'
import { requireActorMember, requirePermission } from '~~/server/utils/permissions'
import { assertRecordingAcceptable } from '~~/server/utils/recordings'
import { bookTitle, familyName, findOrCreateGuestVoice, memberName, notifyParents, requireRecordShare } from '~~/server/utils/shares'
import { badRequest, isNonEmptyString, notFound, requireParam } from '~~/server/utils/validate'

interface IAudioBody {
    fileId?: string
    ms?: number
    language?: string
}

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await requirePermission(event, 'shares.record')
    const memberId = requireActorMember(actor)
    const db = getDb()
    const share = await requireRecordShare(db, actor, requireParam(event, 'id'))
    const lineId = requireParam(event, 'lineId')
    const body = await readBody<IAudioBody>(event)
    if (!isNonEmptyString(body.fileId)) {
        return badRequest('A file is required')
    }
    if (!isNonEmptyString(body.language)) {
        return badRequest('A recording language is required')
    }
    const language = checkLanguage(body.language)
    await assertSpokenLanguage(db, memberId, language)
    const [line] = await db<{ bookId: string }[]>`
        select l.book_id from share_lines sl
        join lines l on l.id = sl.line_id
        join books b on b.id = l.book_id
        where sl.share_id = ${share.id} and sl.line_id = ${lineId} and b.deleted_at is null
    `
    if (!line) {
        return notFound('Line not found')
    }
    await assertFilesInFamily(db, actor.familyId, [body.fileId])
    const [shared] = await db<{ mime: string }[]>`select mime from files where id = ${body.fileId} and family_id = ${actor.familyId}`
    const sharedDurationMs = assertRecordingAcceptable(shared?.mime ?? '', body.ms)
    const guest = await findOrCreateGuestVoice(db, share.ownerFamilyId, actor.familyId, memberId)
    if (isVoiceBlocked(guest.status, guest.voicePolicy)) {
        throw createError({ statusCode: 403, statusMessage: 'This voice is blocked' })
    }
    const [existing] = await db<{ memberId: string }[]>`
        select member_id from recordings where line_id = ${lineId} and language = ${language} and status <> 'stale'
    `
    if (existing && existing.memberId !== guest.id) {
        throw createError({ statusCode: 409, statusMessage: 'This line already has a recording' })
    }
    await db.begin(async tx => {
        const [copy] = await tx<{ id: string; mime: string }[]>`
            insert into files (family_id, mime, data)
            select ${share.ownerFamilyId}, mime, data from files where id = ${body.fileId!} and family_id = ${actor.familyId}
            returning id, mime
        `
        await preserveApprovedTake(tx, lineId, share.ownerFamilyId, language)
        await tx`
            insert into recordings (family_id, line_id, member_id, language, file_id, duration_ms, mime, status)
            values (${share.ownerFamilyId}, ${lineId}, ${guest.id}, ${language}, ${copy!.id}, ${sharedDurationMs}, ${copy!.mime}, 'submitted')
            on conflict (line_id, language) do update set
                member_id = excluded.member_id, file_id = excluded.file_id, duration_ms = excluded.duration_ms,
                mime = excluded.mime, status = 'submitted', created_at = now(), deleted_at = null, deleted_status = null
        `
        await tx`
            update books set voice_languages = array(select distinct unnest(voice_languages || ${language}::text) order by 1)
            where id = ${line.bookId} and not (${language}::text = any(voice_languages))
        `
    })
    await record(event, { ...actorEntry(actor), action: 'share.voice.recorded', entityType: 'share', entityId: share.id, after: { language } })
    await notifyParents(
        db,
        share.ownerFamilyId,
        'voice_batch',
        { fromName: await memberName(db, memberId), familyName: await familyName(db, actor.familyId), bookTitle: await bookTitle(db, share.bookId), bookId: share.bookId },
        `voice:${share.id}:${memberId}`,
    )
    logEvent('Voix reçue d’une autre famille')
    return { ok: true }
})
