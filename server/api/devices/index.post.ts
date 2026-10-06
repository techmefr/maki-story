import { getDb, one } from '../../utils/db'
import { requireSession } from '../../utils/family'
import { hashDeviceSecret, MAX_DEVICES_PER_MEMBER, newDeviceSecret } from '../../utils/device'
import { loadCodeRow } from '~~/technical/Auth/server/utils/profile-code'

const MAX_LABEL_LENGTH = 60

export default defineEventHandler(async (event): Promise<IDeviceEnrolment> => {
    const session = requireSession(event)
    if (!session.memberId) {
        throw createError({ statusCode: 403, statusMessage: 'Choose a profile first' })
    }
    const body = await readBody<{ label?: unknown; isPersonal?: unknown }>(event)
    const label = (typeof body?.label === 'string' ? body.label.trim() : '').slice(0, MAX_LABEL_LENGTH) || 'Appareil'
    const db = getDb()
    const member = await loadCodeRow(db, session.familyId, session.memberId)
    if (!member) {
        throw createError({ statusCode: 403, statusMessage: 'Choose a profile first' })
    }
    const isPersonal = body?.isPersonal === true
    if (isPersonal && member.role === 'child') {
        throw createError({ statusCode: 403, statusMessage: 'A child profile cannot use personal device mode' })
    }
    const [active] = await db<{ count: number }[]>`
        select count(*)::int as count from member_devices where member_id = ${member.id} and revoked_at is null
    `
    if ((active?.count ?? 0) >= MAX_DEVICES_PER_MEMBER) {
        throw createError({ statusCode: 409, statusMessage: 'Too many devices' })
    }
    const secret = newDeviceSecret()
    const created = one(await db<{ id: string }[]>`
        insert into member_devices (family_id, member_id, label, secret_hash, is_personal)
        values (${session.familyId}, ${member.id}, ${label}, ${hashDeviceSecret(secret)}, ${isPersonal})
        returning id
    `)
    return { id: created.id, secret, label }
})
