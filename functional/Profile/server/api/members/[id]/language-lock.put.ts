import { getDb } from '~~/server/utils/db'
import { loadActor } from '~~/server/utils/permissions'
import { assertBookReadable } from '~~/server/utils/books'
import { PROFILE_SCOPE, resolveLanguageConfig } from '~~/server/utils/playback'
import { loadCodeRow, verifyMemberCode } from '~~/server/utils/profile-code'
import { badRequest, notFound, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<ILanguageConfig> => {
    const actor = await loadActor(event)
    const targetId = requireParam(event, 'id')
    const body = await readBody<Partial<ILanguageLockBody>>(event)
    if (typeof body.isLocked !== 'boolean') {
        return badRequest('Invalid lock')
    }
    const bookId = typeof body.bookId === 'string' && body.bookId !== '' ? body.bookId : null
    const db = getDb()
    if (actor.role !== 'parent') {
        if (typeof body.parentId !== 'string') {
            throw createError({ statusCode: 403, statusMessage: 'A parent code is needed' })
        }
        const row = await loadCodeRow(db, actor.familyId, body.parentId)
        if (!row || row.role !== 'parent' || row.status !== 'active') {
            throw createError({ statusCode: 403, statusMessage: 'A parent code is needed' })
        }
        await verifyMemberCode(db, actor.familyId, row, body.code)
    }
    if (bookId) {
        await assertBookReadable({ ...actor, role: 'parent' }, bookId)
    }
    const targets = await db`select 1 from members where id = ${targetId} and family_id = ${actor.familyId} and deleted_at is null`
    if (targets.length === 0) {
        return notFound('Member not found')
    }
    const scope = bookId ?? PROFILE_SCOPE
    const current = await resolveLanguageConfig(targetId, actor.familyId, scope)
    if (!current) {
        throw createError({ statusCode: 409, statusMessage: 'Choose languages first' })
    }
    if (body.isLocked) {
        await db`
            insert into language_configs (member_id, book_id, family_id, languages, is_locked)
            values (${targetId}, ${scope}, ${actor.familyId}, ${current.languages}, true)
            on conflict (member_id, book_id) do update set is_locked = true, updated_at = now()
        `
    } else {
        const effective = current.scope === 'book' ? scope : PROFILE_SCOPE
        await db`
            update language_configs set is_locked = false, updated_at = now()
            where member_id = ${targetId} and family_id = ${actor.familyId} and book_id = ${effective}
        `
    }
    return (await resolveLanguageConfig(targetId, actor.familyId, scope))!
})
