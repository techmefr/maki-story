import { getDb } from '../../../utils/db'
import { loadActor } from '../../../utils/permissions'
import { assertBookReadable } from '../../../utils/books'
import { PROFILE_SCOPE, resolveLanguageConfig } from '../../../utils/playback'
import { badRequest, notFound, requireParam } from '../../../utils/validate'

export default defineEventHandler(async (event): Promise<ILanguageConfig> => {
    const actor = await loadActor(event)
    const targetId = requireParam(event, 'id')
    if (actor.role !== 'parent' && actor.memberId !== targetId) {
        throw createError({ statusCode: 403, statusMessage: 'Your profile cannot do this' })
    }
    const body = await readBody<Partial<ILanguageConfigBody>>(event)
    const languages = parseLanguageList(body.languages)
    if (languages === null) {
        return badRequest('Invalid languages')
    }
    const bookId = typeof body.bookId === 'string' && body.bookId !== '' ? body.bookId : null
    if (bookId) {
        await assertBookReadable(actor, bookId)
    }
    const db = getDb()
    const targets = await db`select 1 from members where id = ${targetId} and family_id = ${actor.familyId} and deleted_at is null`
    if (targets.length === 0) {
        return notFound('Member not found')
    }
    const scope = bookId ?? PROFILE_SCOPE
    const current = await resolveLanguageConfig(targetId, actor.familyId, scope)
    if (actor.role !== 'parent' && current?.isLocked) {
        throw createError({ statusCode: 403, statusMessage: 'The language choice is locked' })
    }
    await db`
        insert into language_configs (member_id, book_id, family_id, languages)
        values (${targetId}, ${scope}, ${actor.familyId}, ${languages})
        on conflict (member_id, book_id) do update set languages = excluded.languages, updated_at = now()
    `
    return (await resolveLanguageConfig(targetId, actor.familyId, scope))!
})
