import { getDb, one } from '../../utils/db'
import { actorEntry, record } from '../../utils/journal'
import { logEvent } from '../../utils/log'
import { memberExtras, readBirthDate } from '../../utils/members'
import { requirePermission } from '../../utils/permissions'
import { hashCode, readCodeInput } from '../../utils/profile-code'
import { badRequest, isMemberRole, isNonEmptyString, isVoiceColor } from '../../utils/validate'

export default defineEventHandler(async (event): Promise<IMember> => {
    const actor = await requirePermission(event, 'members.manage')
    const { familyId } = actor
    const body = await readBody<Partial<IMemberInput>>(event)
    if (!isNonEmptyString(body.name) || !isMemberRole(body.role) || !isVoiceColor(body.color)) {
        return badRequest('Invalid member')
    }
    const birthDate = readBirthDate(body.birthDate, body.role)
    let code: IMemberCodeInput | null = null
    let hash: string | null = null
    if (body.code !== undefined) {
        code = readCodeInput(body.code, body.role)
        hash = await hashCode(code)
    }
    const db = getDb()
    const member = one(await db<IMember[]>`
        insert into members (family_id, name, role, color, pin_hash, code_kind, birth_date, code_enabled)
        values (${familyId}, ${body.name.trim()}, ${body.role}, ${body.color}, ${hash}, ${code?.kind ?? null}, ${birthDate}, ${body.codeEnabled !== false || body.role !== 'child'})
        returning id, name, role, color, photo_file_id, status, pin_hash is not null as has_code, code_kind, spoken_languages, app_locale, voice_policy, source_member_id is not null as is_guest, ${memberExtras(db, actor.role, actor.memberId)}
    `)
    await record(event, { ...actorEntry(actor), action: 'member.created', entityType: 'member', entityId: member.id, after: { role: member.role, hasBirthDate: birthDate !== null } })
    logEvent(`Profil ajouté : ${member.name} (${member.role})`)
    return member
})
