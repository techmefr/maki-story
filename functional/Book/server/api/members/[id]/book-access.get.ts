import { getDb } from '~~/server/utils/db'
import { assertMembersInFamily } from '~~/server/utils/family'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<IBookAccess> => {
    const { familyId } = await requirePermission(event, 'members.manage')
    const id = requireParam(event, 'id')
    const db = getDb()
    await assertMembersInFamily(db, familyId, [id])
    const [member] = await db<{ booksRestricted: boolean }[]>`select books_restricted from members where id = ${id} and role = 'child'`
    const rows = await db<{ bookId: string }[]>`select book_id from book_access where child_id = ${id}`
    return { isRestricted: member?.booksRestricted ?? false, bookIds: rows.map(row => row.bookId) }
})
