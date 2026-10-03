import { Readable } from 'node:stream'
import { getDb } from '~~/server/utils/db'
import { mediaPath } from '~~/server/utils/familyData'
import { actorEntry, record } from '~~/server/utils/journal'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { notFound, requireParam } from '~~/server/utils/validate'
import { zipStream } from '~~/server/utils/zip'
import type { IZipEntry } from '~~/server/utils/zip'

async function* voiceEntries(familyId: string, memberId: string): AsyncGenerator<IZipEntry> {
    const db = getDb()
    const rows = await db<{ id: string; lineId: string; language: string; fileId: string; mime: string; durationMs: number; bookTitle: string }[]>`
        select r.id, r.line_id, r.language, r.file_id, r.mime, r.duration_ms, b.title as book_title
        from recordings r join lines l on l.id = r.line_id join books b on b.id = l.book_id
        where r.member_id = ${memberId} and r.family_id = ${familyId} order by b.title, l.position
    `
    const manifest = rows.map(row => ({ id: row.id, lineId: row.lineId, language: row.language, durationMs: row.durationMs, book: row.bookTitle, path: mediaPath(row.fileId, row.mime) }))
    yield { name: 'voice.json', data: Buffer.from(JSON.stringify(manifest, null, 2), 'utf8') }
    for (const row of rows) {
        const [file] = await db<{ data: Buffer }[]>`select data from files where id = ${row.fileId} and family_id = ${familyId}`
        if (file) {
            yield { name: mediaPath(row.fileId, row.mime), data: file.data }
        }
    }
}

export default defineEventHandler(async event => {
    const actor = await requirePermission(event, 'members.manage')
    const id = requireParam(event, 'id')
    const [member] = await getDb()<{ id: string }[]>`select id from members where id = ${id} and family_id = ${actor.familyId} and source_member_id is null`
    if (!member) {
        return notFound('Member not found')
    }
    await record(event, { ...actorEntry(actor), action: 'member.voice.exported', entityType: 'member', entityId: id })
    setResponseHeader(event, 'content-type', 'application/zip')
    setResponseHeader(event, 'content-disposition', 'attachment; filename="tantara-voice-export.zip"')
    setResponseHeader(event, 'cache-control', 'no-store')
    return sendStream(event, Readable.from(zipStream(voiceEntries(actor.familyId, id))))
})
