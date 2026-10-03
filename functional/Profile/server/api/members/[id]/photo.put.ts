import { getDb, one } from '~~/server/utils/db'
import { logEvent } from '~~/server/utils/log'
import { memberExtras } from '~~/server/utils/members'
import { requireSettingsScope } from '~~/server/utils/settings'
import { badRequest, requireParam } from '~~/server/utils/validate'

const MAX_PHOTO_BYTES = 4 * 1024 * 1024

export default defineEventHandler(async (event): Promise<IMember> => {
    const scope = await requireSettingsScope(event, requireParam(event, 'id'))
    const mime = (getHeader(event, 'content-type') ?? '').split(';')[0]?.trim() ?? ''
    if (!mime.startsWith('image/')) {
        return badRequest('Unsupported file type')
    }
    const raw = await readRawBody(event, false)
    if (!raw || raw.length === 0) {
        return badRequest('Empty file')
    }
    if (raw.length > MAX_PHOTO_BYTES) {
        return badRequest('File is too large')
    }
    const member = await getDb().begin(async tx => {
        const file = one(await tx<{ id: string }[]>`
            insert into files (family_id, mime, data) values (${scope.actor.familyId}, ${mime}, ${raw}) returning id
        `)
        return one(await tx<IMember[]>`
            update members set photo_file_id = ${file.id}
            where id = ${scope.targetId} and family_id = ${scope.actor.familyId}
            returning id, name, role, color, photo_file_id, status, pin_hash is not null as has_code, code_kind, spoken_languages, app_locale, ${memberExtras(tx, scope.actor.role, scope.actor.id)}
        `)
    })
    logEvent('Photo de profil changée')
    return member
})
