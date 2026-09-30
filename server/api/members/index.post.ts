import { getDb, one } from '../../utils/db'
import { logEvent } from '../../utils/log'
import { badRequest, isMemberRole, isNonEmptyString, isVoiceColor } from '../../utils/validate'

export default defineEventHandler(async (event): Promise<IMember> => {
    const body = await readBody<Partial<IMemberInput>>(event)
    if (!isNonEmptyString(body.name) || !isMemberRole(body.role) || !isVoiceColor(body.color)) {
        return badRequest('Invalid member')
    }
    const member = one(await getDb()<IMember[]>`
        insert into members (name, role, color)
        values (${body.name.trim()}, ${body.role}, ${body.color})
        returning id, name, role, color, photo_file_id
    `)
    logEvent(`Profil ajouté : ${member.name} (${member.role})`)
    return member
})
