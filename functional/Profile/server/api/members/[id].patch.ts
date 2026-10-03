import { getDb, one } from '~~/server/utils/db'
import { assertFilesInFamily } from '~~/server/utils/family'
import { actorEntry, record } from '~~/server/utils/journal'
import { memberExtras, readBirthDate } from '~~/server/utils/members'
import { syncMembershipStatus } from '~~/server/utils/memberships'
import { requirePermission } from '~~/server/utils/permissions'
import { badRequest, isMemberRole, isNonEmptyString, isVoiceColor, notFound, requireParam } from '~~/server/utils/validate'

interface IMemberPatch {
    name?: string
    role?: MemberRole
    color?: VoiceColorId
    photoFileId?: string | null
    status?: MemberStatus
    voicePolicy?: VoicePolicy
    birthDate?: string | null
    codeEnabled?: boolean
    ageShift?: number
}

const SETTABLE_STATUSES: MemberStatus[] = ['active', 'left', 'deceased', 'blocked']
const MAX_AGE_SHIFT = 5
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
    if (body.ageShift !== undefined && (!Number.isInteger(body.ageShift) || body.ageShift < -MAX_AGE_SHIFT || body.ageShift > MAX_AGE_SHIFT)) {
        return badRequest('Invalid age shift')
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
    if (body.codeEnabled !== undefined && (typeof body.codeEnabled !== 'boolean' || next.role !== 'child')) {
        return badRequest('Only a child code can be switched on or off')
    }
    if (body.ageShift !== undefined && current.role !== 'child') {
        return badRequest('Only a child has an age shift')
    }
    const hasBirthDate = body.birthDate !== undefined
    const birthDate = hasBirthDate ? readBirthDate(body.birthDate, next.role) : null
    const updated = one(await db<IMember[]>`
        update members
        set name = ${next.name}, role = ${next.role}, color = ${next.color}, photo_file_id = ${next.photoFileId}, status = ${next.status}, voice_policy = ${next.voicePolicy},
            birth_date = case when ${hasBirthDate}::boolean then ${birthDate}::date else birth_date end,
            code_enabled = coalesce(${body.codeEnabled ?? null}::boolean, code_enabled),
            age_shift = coalesce(${body.ageShift ?? null}::int, age_shift)
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
        after: { name: updated.name, role: updated.role, status: updated.status, birthDateChanged: hasBirthDate, codeEnabled: body.codeEnabled ?? null },
    })
    return updated
})
