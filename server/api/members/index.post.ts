import { getDb, one } from '../../utils/db'
import { requireFamily } from '../../utils/family'
import { logEvent } from '../../utils/log'
import { badRequest, isMemberRole, isNonEmptyString, isVoiceColor } from '../../utils/validate'

export default defineEventHandler(async (event): Promise<IMember> => {
    const familyId = requireFamily(event)
    const body = await readBody<Partial<IMemberInput>>(event)
    if (!isNonEmptyString(body.name) || !isMemberRole(body.role) || !isVoiceColor(body.color)) {
        return badRequest('Invalid member')
    }
    const member = one(await getDb()<IMember[]>`
        insert into members (family_id, name, role, color)
        values (${familyId}, ${body.name.trim()}, ${body.role}, ${body.color})
        returning id, name, role, color, photo_file_id, status
    `)
    logEvent(`Profil ajouté : ${member.name} (${member.role})`)
    return member
})
