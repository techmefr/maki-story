import { getDb } from '~~/server/utils/db'
import { assertMembersInFamily } from '~~/server/utils/family'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { badRequest, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<IBookAccess> => {
    const { familyId } = await requirePermission(event, 'members.manage')
    const id = requireParam(event, 'id')
    const body = await readBody<Partial<IBookAccess>>(event)
    if (typeof body.isRestricted !== 'boolean' || !Array.isArray(body.bookIds) || !body.bookIds.every(item => typeof item === 'string')) {
        return badRequest('Invalid book access')
    }
    const isRestricted = body.isRestricted
    const bookIds = [...new Set(body.bookIds)]
    const db = getDb()
    await assertMembersInFamily(db, familyId, [id])
    await db.begin(async tx => {
        const [child] = await tx`select id from members where id = ${id} and role = 'child' and family_id = ${familyId} and deleted_at is null`
        if (!child) {
            return badRequest('Only a child has a book selection')
        }
        if (bookIds.length > 0) {
            const known = await tx<{ id: string }[]>`select id from books where family_id = ${familyId} and deleted_at is null and id in ${tx(bookIds)}`
            if (known.length !== bookIds.length) {
                return badRequest('Unknown book')
            }
        }
        await tx`update members set books_restricted = ${isRestricted} where id = ${id}`
        await tx`delete from book_access where child_id = ${id}`
        for (const bookId of bookIds) {
            await tx`insert into book_access (child_id, book_id) values (${id}, ${bookId})`
        }
    })
    return { isRestricted: body.isRestricted, bookIds }
})
