import { checkLanguage } from '../../../../../utils/bookModel'
import { getDb } from '../../../../../utils/db'
import { assertFilesInFamily } from '../../../../../utils/family'
import { logEvent } from '../../../../../utils/log'
import { notify } from '../../../../../utils/notifications'
import { assertCanRecordLine, requireActorMember, requirePermission } from '../../../../../utils/permissions'
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
    await db`
        insert into recordings (family_id, line_id, member_id, language, file_id, duration_ms, mime, status)
        values (${familyId}, ${lineId}, ${recorderId}, ${language}, ${body.fileId}, ${Math.max(0, Math.round(body.ms ?? 0))}, ${file!.mime}, 'draft')
        on conflict (line_id, language) do update set
            member_id = excluded.member_id, file_id = excluded.file_id, duration_ms = excluded.duration_ms,
            mime = excluded.mime, status = 'draft', created_at = now()
    `
    if (actor.role === 'relative') {
        const [member] = await db<{ name: string }[]>`select name from members where id = ${recorderId}`
        await notify(db, {
            familyId,
            recipientMemberId: null,
            kind: 'recording_batch',
            payload: { memberName: member?.name ?? '', bookTitle: line.title, bookId },
            groupKey: `recording:${bookId}:${recorderId}`,
        })
    }
    logEvent('Enregistrement sauvegardé')
    return { ok: true }
})
