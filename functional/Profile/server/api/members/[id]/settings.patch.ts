import { isLanguageCode } from '~~/shared/utils/languages'
import { getDb, one } from '~~/server/utils/db'
import { assertFilesInFamily } from '~~/server/utils/family'
import { memberExtras } from '~~/server/utils/members'
import { requireSettingsScope } from '~~/server/utils/settings'
import { badRequest, requireParam } from '~~/server/utils/validate'

const MAX_SPOKEN_LANGUAGES = 12

export default defineEventHandler(async (event): Promise<IMember> => {
    const scope = await requireSettingsScope(event, requireParam(event, 'id'))
    const body = await readBody<IMemberSettingsInput>(event)
    const isChildSelf = scope.isSelf && scope.actor.role === 'child'
    if (isChildSelf && body.spokenLanguages !== undefined) {
        throw createError({ statusCode: 403, statusMessage: 'A child cannot change the spoken languages' })
    }
    if (body.spokenLanguages !== undefined) {
        const languages = body.spokenLanguages
        if (!Array.isArray(languages) || languages.length > MAX_SPOKEN_LANGUAGES || !languages.every(isLanguageCode)) {
            return badRequest('Invalid languages')
        }
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
    const spokenLanguages = body.spokenLanguages ? [...new Set(body.spokenLanguages)] : current.spokenLanguages
    const appLocale = body.appLocale === undefined ? current.appLocale : body.appLocale
    const photoFileId = body.photoFileId === undefined ? current.photoFileId : body.photoFileId
    return one(await db<IMember[]>`
        update members
        set photo_file_id = ${photoFileId}, spoken_languages = ${spokenLanguages}, app_locale = ${appLocale}
        where id = ${scope.targetId} and family_id = ${scope.actor.familyId}
        returning id, name, role, color, photo_file_id, status, pin_hash is not null as has_code, code_kind, spoken_languages, app_locale, ${memberExtras(db, scope.actor.role, scope.actor.id)}
    `)
})
