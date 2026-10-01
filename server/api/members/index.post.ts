import { getDb, one } from '../../utils/db'
import { requireFamily } from '../../utils/family'
import { logEvent } from '../../utils/log'
import { hashCode, readCodeInput, requireActor } from '../../utils/profile-code'
import { badRequest, isMemberRole, isNonEmptyString, isVoiceColor } from '../../utils/validate'

export default defineEventHandler(async (event): Promise<IMember> => {
    const familyId = requireFamily(event)
    const body = await readBody<Partial<IMemberInput>>(event)
    if (!isNonEmptyString(body.name) || !isMemberRole(body.role) || !isVoiceColor(body.color)) {
        return badRequest('Invalid member')
    }
    let code: IMemberCodeInput | null = null
    let hash: string | null = null
    if (body.code !== undefined) {
        const actor = await requireActor(event)
        if (actor.role !== 'parent') {
            throw createError({ statusCode: 403, statusMessage: 'Only a parent can set a code' })
        }
        code = readCodeInput(body.code)
        hash = await hashCode(code)
    }
    const member = one(await getDb()<IMember[]>`
        insert into members (family_id, name, role, color, pin_hash, code_kind)
        values (${familyId}, ${body.name.trim()}, ${body.role}, ${body.color}, ${hash}, ${code?.kind ?? null})
        returning id, name, role, color, photo_file_id, status, pin_hash is not null as has_code, code_kind, spoken_languages, app_locale
    `)
    logEvent(`Profil ajouté : ${member.name} (${member.role})`)
    return member
})
