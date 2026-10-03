import { assertBookOwned, checkColor, checkName, checkText } from '~~/server/utils/bookModel'
import { getDb, one } from '~~/server/utils/db'
import { requireBookEditor } from '~~/technical/Auth/server/utils/permissions'
import { badRequest, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<ICharacter> => {
    const { familyId } = await requireBookEditor(event)
    const bookId = requireParam(event, 'id')
    const body = await readBody<ICharacterBody>(event)
    const name = checkName(body.name)
    const description = checkText(body.description, 'description')
    const isNarrator = body.isNarrator === true
    const color = isNarrator ? null : checkColor(body.color)
    const db = getDb()
    await assertBookOwned(db, bookId, familyId)
    return db.begin(async tx => {
        const duplicate = await tx`select 1 from characters where book_id = ${bookId} and lower(name) = lower(${name})`
        if (duplicate.length > 0) {
            return badRequest('This character already exists')
        }
        if (isNarrator) {
            const narrator = await tx`select 1 from characters where book_id = ${bookId} and is_narrator`
            if (narrator.length > 0) {
                return badRequest('This book already has a narrator')
            }
        }
        return one(await tx<ICharacter[]>`
            insert into characters (book_id, family_id, name, color, description, is_narrator, position)
            values (${bookId}, ${familyId}, ${name}, ${color}, ${description}, ${isNarrator},
                (select coalesce(max(position) + 1, 0) from characters where book_id = ${bookId}))
            returning id, name, color, description, is_narrator, position
        `)
    })
})
