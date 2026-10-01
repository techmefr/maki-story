import { getDb } from '../../../utils/db'
import { requirePermission } from '../../../utils/permissions'
import { requireRecordShare } from '../../../utils/shares'
import { requireParam } from '../../../utils/validate'

export default defineEventHandler(async (event): Promise<IShareBook> => {
    const actor = await requirePermission(event, 'shares.record')
    const db = getDb()
    const share = await requireRecordShare(db, actor, requireParam(event, 'id'))
    const [book] = await db<{ title: string; language: string }[]>`select title, language from books where id = ${share.bookId}`
    const lines = await db<IShareLine[]>`
        select l.id, l.page_index, coalesce(c.name, l.character) as character, l.text, l.note, l.tone, l.scene_description,
            exists (select 1 from recordings r where r.line_id = l.id and r.language = ${book!.language} and r.status <> 'stale') as has_recording
        from share_lines sl
        join lines l on l.id = sl.line_id
        left join characters c on c.id = l.character_id
        where sl.share_id = ${share.id} order by l.position
    `
    return { shareId: share.id, title: book!.title, language: book!.language, lines }
})
