import { getDb } from '~~/server/utils/db'
import { requireBookEditor } from '~~/technical/Auth/server/utils/permissions'
import { checkLanguage } from '~~/server/utils/bookModel'
import { badRequest, notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<{ translatedLanguages: string[] }> => {
    const { familyId } = await requireBookEditor(event)
    const id = requireParam(event, 'id')
    const body = await readBody<{ language?: unknown; isDone?: unknown }>(event)
    if (typeof body.isDone !== 'boolean') {
        return badRequest('Invalid value')
    }
    const language = checkLanguage(body.language)
    const db = getDb()
    const [book] = await db<{ language: string; translatedLanguages: string[] }[]>`
        select language, translated_languages from books where id = ${id} and family_id = ${familyId} and deleted_at is null
    `
    if (!book) {
        return notFound('Book not found')
    }
    const others = book.translatedLanguages.filter(code => code !== language)
    const next = body.isDone && language !== book.language ? [...others, language] : others
    await db`update books set translated_languages = ${next} where id = ${id} and family_id = ${familyId}`
    return { translatedLanguages: next }
})
