import { isLanguageCode } from '~~/shared/utils/languages'
import { getDb, one } from '~~/server/utils/db'
import { isOutsideFamily } from '~~/functional/Profile/server/utils/familyLanguages'
import { assertFilesInFamily } from '~~/server/utils/family'
import { memberExtras } from '~~/server/utils/members'
import { requireSettingsScope } from '~~/server/utils/settings'
import { badRequest, isNonEmptyString, requireParam } from '~~/server/utils/validate'

const MAX_SPOKEN_LANGUAGES = 12
const MAX_NAME_LENGTH = 60

export default defineEventHandler(async (event): Promise<IMember> => {
    const scope = await requireSettingsScope(event, requireParam(event, 'id'))
    const body = await readBody<IMemberSettingsInput>(event)
    const isChildSelf = scope.isSelf && scope.actor.role === 'child'
    if (isChildSelf && body.spokenLanguages !== undefined) {
        throw createError({ statusCode: 403, statusMessage: 'A child cannot change the spoken languages' })
    }
    if (isChildSelf && body.name !== undefined) {
        throw createError({ statusCode: 403, statusMessage: 'A child cannot change the name' })
    }
    if (body.spokenLanguages !== undefined) {
        const languages = body.spokenLanguages
        if (!Array.isArray(languages) || languages.length > MAX_SPOKEN_LANGUAGES || !languages.every(isLanguageCode)) {
            return badRequest('Invalid languages')
        }
    }
    if (body.name !== undefined && (!isNonEmptyString(body.name) || body.name.trim().length > MAX_NAME_LENGTH)) {
        return badRequest('Invalid name')
    }
    if (body.appLocale !== undefined && body.appLocale !== null && !isLanguageCode(body.appLocale)) {
        return badRequest('Invalid locale')
    }
    const db = getDb()
    if (typeof body.photoFileId === 'string') {
        await assertFilesInFamily(db, scope.actor.familyId, [body.photoFileId])
    }
    const current = one(await db<IMember[]>`
        select id, name, role, color, photo_file_id, status, pin_hash is not null as has_code, code_kind, spoken_languages, app_locale, ${memberExtras(db, scope.actor.role, scope.actor.id)}
        from members where id = ${scope.targetId} and family_id = ${scope.actor.familyId}
    `)
    if (body.spokenLanguages && scope.actor.role !== 'parent' && (await isOutsideFamily(db, scope.actor.familyId, body.spokenLanguages, current.spokenLanguages))) {
        return badRequest('Language outside the family')
    }
    const spokenLanguages = body.spokenLanguages ? [...new Set(body.spokenLanguages)] : current.spokenLanguages
    const appLocale = body.appLocale === undefined ? current.appLocale : body.appLocale
    const photoFileId = body.photoFileId === undefined ? current.photoFileId : body.photoFileId
    const name = body.name === undefined ? current.name : body.name.trim()
    return one(await db<IMember[]>`
        update members
        set name = ${name}, photo_file_id = ${photoFileId}, spoken_languages = ${spokenLanguages}, app_locale = ${appLocale}
        where id = ${scope.targetId} and family_id = ${scope.actor.familyId}
        returning id, name, role, color, photo_file_id, status, pin_hash is not null as has_code, code_kind, spoken_languages, app_locale, ${memberExtras(db, scope.actor.role, scope.actor.id)}
    `)
})
