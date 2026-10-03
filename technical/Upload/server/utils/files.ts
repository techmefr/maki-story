import { bookScope, bookScopeParams } from '~~/server/utils/books'
import { getDb } from '~~/server/utils/db'
import type { IActor } from '~~/technical/Auth/server/utils/permissions'

export const assertFileReadable = async (actor: IActor, fileId: string): Promise<void> => {
    if (actor.role === 'parent') {
        return
    }
    const { memberId } = actor
    const isChild = actor.role === 'child'
    const scope = bookScope(actor, 5)
    const rows = await getDb().unsafe(
        `select 1 where
            exists (select 1 from files where id = $1 and family_id = $2 and created_by_member_id = $3)
            or exists (select 1 from members where photo_file_id = $1 and family_id = $2 and deleted_at is null)
            or exists (
                select 1 from messages m
                where m.file_id = $1 and m.family_id = $2 and m.deleted_at is null and m.status = 'ACTIVE'
                    and (m.expires_at is null or m.expires_at > now())
                    and (m.from_member_id = $3 or m.to_member_id = $3)
            )
            or exists (
                select 1 from treasures t where t.file_id = $1 and t.family_id = $2 and t.deleted_at is null and t.child_id = $3
            )
            or exists (
                select 1 from ${isChild ? 'child_recordings' : 'recordings'} r join lines l on l.id = r.line_id join books b on b.id = l.book_id
                where r.file_id = $1 and b.family_id = $2 and b.deleted_at is null and ${scope}
            )
            or exists (
                select 1 from book_pages p join books b on b.id = p.book_id
                where not $4::boolean and p.file_id = $1 and b.family_id = $2 and b.deleted_at is null and ${scope}
            )`,
        [fileId, actor.familyId, memberId, isChild, ...bookScopeParams(actor)],
    )
    if (rows.length === 0) {
        throw createError({ statusCode: 403, statusMessage: 'This file is not available to your profile' })
    }
}
