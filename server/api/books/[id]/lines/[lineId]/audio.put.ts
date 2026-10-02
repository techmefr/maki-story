import { checkLanguage } from '../../../../../utils/bookModel'
import { getDb } from '../../../../../utils/db'
import { assertFilesInFamily } from '../../../../../utils/family'
import { actorEntry, record } from '../../../../../utils/journal'
import { logEvent } from '../../../../../utils/log'
import { preserveApprovedTake } from '../../../../../utils/recordings'
import { assertCanRecordLine, requireActorMember, requirePermission } from '../../../../../utils/permissions'
import { assertRecordingAcceptable, assertSpokenLanguage } from '../../../../../utils/recordings'
import { findReviewBook, recordSubmission } from '../../../../../utils/review'
import { isVoiceBlocked } from '../../../../../../shared/utils/blocking'
import { badRequest, isNonEmptyString, notFound, requireParam } from '../../../../../utils/validate'

interface IAudioBody {
    fileId?: string
    ms?: number
    language?: string
}

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const actor = await requirePermission(event, 'lines.record')
    const { familyId } = actor
    const bookId = requireParam(event, 'id')
    const lineId = requireParam(event, 'lineId')
    const body = await readBody<IAudioBody>(event)
    if (!isNonEmptyString(body.fileId)) {
        return badRequest('A file is required')
    }
    const db = getDb()
    const [line] = await db<{ memberId: string | null; language: string; title: string }[]>`
        select l.member_id, b.language, b.title
        from lines l join books b on b.id = l.book_id
        where l.id = ${lineId} and l.book_id = ${bookId} and l.family_id = ${familyId} and b.deleted_at is null
    `
    if (!line) {
        return notFound('Line not found')
    }
    assertCanRecordLine(actor, line.memberId)
    await assertFilesInFamily(db, familyId, [body.fileId])
    if (line.memberId === null) {
        return badRequest('Cast this line before recording it')
    }
    const [cast] = await db<{ status: MemberStatus; voicePolicy: VoicePolicy }[]>`select status, voice_policy from members where id = ${line.memberId}`
    const isCastBlocked = cast !== undefined && isVoiceBlocked(cast.status, cast.voicePolicy)
    const recorderId = isCastBlocked && actor.role === 'parent' ? requireActorMember(actor) : line.memberId
    if (recorderId !== line.memberId) {
        await db`update lines set member_id = ${recorderId} where id = ${lineId} and family_id = ${familyId}`
    }
    const language = body.language === undefined ? line.language : checkLanguage(body.language)
    const [file] = await db<{ mime: string }[]>`select mime from files where id = ${body.fileId} and family_id = ${familyId}`
    const fileId = body.fileId
    const durationMs = assertRecordingAcceptable(file!.mime, body.ms)
    await assertSpokenLanguage(db, recorderId, language)
    await db.begin(async tx => {
        const [previous] = await tx<{ status: RecordingStatus }[]>`
            select status from recordings where line_id = ${lineId} and family_id = ${familyId} and language = ${language} for update
        `
        const [open] = await tx<{ id: string }[]>`select id from review_comments where line_id = ${lineId} and resolved_at is null limit 1`
        const isRedo = actor.role === 'relative' && (previous?.status === 'changes_requested' || open !== undefined)
        const status: RecordingStatus = isRedo ? 'submitted' : 'draft'
        await preserveApprovedTake(tx, lineId, familyId, language)
        await tx`
            insert into recordings (family_id, line_id, member_id, language, file_id, duration_ms, mime, status)
            values (${familyId}, ${lineId}, ${recorderId}, ${language}, ${fileId}, ${durationMs}, ${file!.mime}, ${status})
            on conflict (line_id, language) do update set
                member_id = excluded.member_id, file_id = excluded.file_id, duration_ms = excluded.duration_ms,
                mime = excluded.mime, status = excluded.status, created_at = now(), deleted_at = null, deleted_status = null
        `
        if (isRedo) {
            await tx`update review_comments set resolved_at = now() where line_id = ${lineId} and resolved_at is null`
            const book = await findReviewBook(tx, bookId, familyId)
            await recordSubmission(tx, { familyId, book, memberId: recorderId, count: 1, lineId, kind: 'resubmitted' })
        }
    })
    await record(event, { ...actorEntry(actor), action: 'recording.saved', entityType: 'line', entityId: lineId, after: { language, status: 'saved' } })
    logEvent('Enregistrement sauvegardé')
    return { ok: true }
})
