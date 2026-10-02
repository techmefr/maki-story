import { getDb, one } from '../../utils/db'
import { assertFilesInFamily } from '../../utils/family'
import { actorEntry, record } from '../../utils/journal'
import { memberExtras, readBirthDate } from '../../utils/members'
import { syncMembershipStatus } from '../../utils/memberships'
import { requirePermission } from '../../utils/permissions'
import { badRequest, isMemberRole, isNonEmptyString, isVoiceColor, notFound, requireParam } from '../../utils/validate'

interface IMemberPatch {
    name?: string
    role?: MemberRole
    color?: VoiceColorId
    photoFileId?: string | null
    status?: MemberStatus
    voicePolicy?: VoicePolicy
    birthDate?: string | null
}

const SETTABLE_STATUSES: MemberStatus[] = ['active', 'left', 'deceased', 'blocked']
const VOICE_POLICIES: VoicePolicy[] = ['keep', 'block', 'rerecord']

export default defineEventHandler(async (event): Promise<IMember> => {
    const actor = await requirePermission(event, 'members.manage')
    const { familyId } = actor
    const id = requireParam(event, 'id')
    const body = await readBody<IMemberPatch>(event)
    if (body.name !== undefined && !isNonEmptyString(body.name)) {
        return badRequest('Invalid name')
    }
    if (body.role !== undefined && !isMemberRole(body.role)) {
        return badRequest('Invalid role')
    }
    if (body.color !== undefined && !isVoiceColor(body.color)) {
        return badRequest('Invalid color')
    }
    if (body.status !== undefined && !SETTABLE_STATUSES.includes(body.status)) {
        return badRequest('Invalid status')
    }
    if (body.voicePolicy !== undefined && !VOICE_POLICIES.includes(body.voicePolicy)) {
        return badRequest('Invalid voice policy')
    }
    const db = getDb()
    const [current] = await db<IMember[]>`
        select id, name, role, color, photo_file_id, status, pin_hash is not null as has_code, code_kind, spoken_languages, app_locale, voice_policy, source_member_id is not null as is_guest, ${memberExtras(db, actor.role, actor.memberId)} from members
        where id = ${id} and family_id = ${familyId} and deleted_at is null
    `
    if (!current) {
        return notFound('Member not found')
    }
    if (current.isGuest && body.role !== undefined && body.role !== 'relative') {
        return badRequest('A guest voice stays a relative')
    }
    if (body.status !== undefined && body.status !== current.status && current.role !== 'relative') {
        return badRequest('Only a relative can be marked as left, deceased or blocked')
    }
    if (current.role === 'parent' && body.role !== undefined && body.role !== 'parent') {
        const { count } = one(await db<{ count: number }[]>`
            select count(*)::int as count from members
            where family_id = ${familyId} and role = 'parent' and deleted_at is null and id <> ${id}
        `)
        if (count === 0) {
            return badRequest('At least one parent is required')
        }
    }
    if (typeof body.photoFileId === 'string') {
        await assertFilesInFamily(db, familyId, [body.photoFileId])
    }
    const next = {
        name: body.name?.trim() ?? current.name,
        role: body.role ?? current.role,
        color: body.color ?? current.color,
        photoFileId: body.photoFileId === undefined ? current.photoFileId : body.photoFileId,
        status: body.status ?? current.status,
        voicePolicy: body.voicePolicy ?? current.voicePolicy,
    }
    if (body.voicePolicy !== undefined && current.role !== 'relative') {
        return badRequest('Only a relative has a voice policy')
    }
    const hasBirthDate = body.birthDate !== undefined
    const birthDate = hasBirthDate ? readBirthDate(body.birthDate, next.role) : null
    const updated = one(await db<IMember[]>`
        update members
        set name = ${next.name}, role = ${next.role}, color = ${next.color}, photo_file_id = ${next.photoFileId}, status = ${next.status}, voice_policy = ${next.voicePolicy},
            birth_date = case when ${hasBirthDate}::boolean then ${birthDate}::date else birth_date end
        where id = ${id} and family_id = ${familyId}
        returning id, name, role, color, photo_file_id, status, pin_hash is not null as has_code, code_kind, spoken_languages, app_locale, voice_policy, source_member_id is not null as is_guest, ${memberExtras(db, actor.role, actor.memberId)}
    `)
    if (updated.status !== current.status) {
        await syncMembershipStatus(db, id, updated.status)
    }
    await record(event, {
        ...actorEntry(actor),
        action: 'member.updated',
        entityType: 'member',
        entityId: id,
        before: { name: current.name, role: current.role, status: current.status },
        after: { name: updated.name, role: updated.role, status: updated.status, birthDateChanged: hasBirthDate },
    })
    return updated
})
