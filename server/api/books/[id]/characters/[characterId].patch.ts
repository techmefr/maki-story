import { assertBookOwned, checkColor, checkName, checkText } from '../../../../utils/bookModel'
import { getDb, one } from '../../../../utils/db'
import { requireBookEditor } from '../../../../utils/permissions'
import { badRequest, notFound, requireParam } from '../../../../utils/validate'

export default defineEventHandler(async (event): Promise<ICharacter> => {
    const { familyId } = await requireBookEditor(event)
    const bookId = requireParam(event, 'id')
    const characterId = requireParam(event, 'characterId')
    const body = await readBody<ICharacterBody>(event)
    const db = getDb()
    await assertBookOwned(db, bookId, familyId)
    return db.begin(async tx => {
        const [current] = await tx<ICharacter[]>`
            select id, name, color, description, is_narrator, position from characters
            where id = ${characterId} and book_id = ${bookId} and family_id = ${familyId}
        `
        if (!current) {
            return notFound('Character not found')
        }
        const name = body.name === undefined ? current.name : checkName(body.name)
        const color = body.color === undefined ? current.color : checkColor(body.color)
        const description = body.description === undefined ? current.description : checkText(body.description, 'description')
        const isNarrator = body.isNarrator === undefined ? current.isNarrator : body.isNarrator === true
        const duplicate = await tx`
            select 1 from characters where book_id = ${bookId} and lower(name) = lower(${name}) and id <> ${characterId}
        `
        if (duplicate.length > 0) {
            return badRequest('This character already exists')
        }
        if (isNarrator && !current.isNarrator) {
            const narrator = await tx`select 1 from characters where book_id = ${bookId} and is_narrator`
            if (narrator.length > 0) {
                return badRequest('This book already has a narrator')
            }
        }
        const updated = one(await tx<ICharacter[]>`
            update characters set name = ${name}, color = ${color}, description = ${description}, is_narrator = ${isNarrator}
            where id = ${characterId} and family_id = ${familyId}
            returning id, name, color, description, is_narrator, position
        `)
        await tx`update lines set character = ${name} where character_id = ${characterId} and family_id = ${familyId}`
        return updated
    })
})
