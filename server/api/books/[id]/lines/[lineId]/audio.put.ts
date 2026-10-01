import { checkLanguage } from '../../../../../utils/bookModel'
import { getDb } from '../../../../../utils/db'
import { assertFilesInFamily, requireFamily } from '../../../../../utils/family'
import { logEvent } from '../../../../../utils/log'
import { badRequest, isNonEmptyString, notFound, requireParam } from '../../../../../utils/validate'

interface IAudioBody {
    fileId?: string
    ms?: number
    language?: string
}

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const familyId = requireFamily(event)
    const bookId = requireParam(event, 'id')
    const lineId = requireParam(event, 'lineId')
    const body = await readBody<IAudioBody>(event)
    if (!isNonEmptyString(body.fileId)) {
        return badRequest('A file is required')
    }
    const db = getDb()
    const [line] = await db<{ memberId: string | null; language: string }[]>`
        select l.member_id, b.language from lines l join books b on b.id = l.book_id
        where l.id = ${lineId} and l.book_id = ${bookId} and l.family_id = ${familyId} and b.deleted_at is null
    `
    if (!line) {
        return notFound('Line not found')
    }
    await assertFilesInFamily(db, familyId, [body.fileId])
    if (line.memberId === null) {
        return badRequest('Cast this line before recording it')
    }
    const language = body.language === undefined ? line.language : checkLanguage(body.language)
    const [file] = await db<{ mime: string }[]>`select mime from files where id = ${body.fileId} and family_id = ${familyId}`
    await db`
        insert into recordings (family_id, line_id, member_id, language, file_id, duration_ms, mime, status)
        values (${familyId}, ${lineId}, ${line.memberId}, ${language}, ${body.fileId}, ${Math.max(0, Math.round(body.ms ?? 0))}, ${file!.mime}, 'draft')
        on conflict (line_id, language) do update set
            member_id = excluded.member_id, file_id = excluded.file_id, duration_ms = excluded.duration_ms,
            mime = excluded.mime, status = 'draft', created_at = now()
    `
    logEvent('Enregistrement sauvegardé')
    return { ok: true }
})
