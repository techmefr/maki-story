import { getDb } from '../../utils/db'
import { badRequest, isMemberRole, isNonEmptyString, isVoiceColor, notFound, requireParam } from '../../utils/validate'

interface IMemberPatch {
    name?: string
    role?: MemberRole
    color?: VoiceColorId
    photoFileId?: string | null
}

export default defineEventHandler(async (event): Promise<IMember> => {
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
    const db = getDb()
    const [current] = await db<IMember[]>`
        select id, name, role, color, photo_file_id from members where id = ${id}
    `
    if (!current) {
        return notFound('Member not found')
    }
    const next = {
        name: body.name?.trim() ?? current.name,
        role: body.role ?? current.role,
        color: body.color ?? current.color,
        photoFileId: body.photoFileId === undefined ? current.photoFileId : body.photoFileId,
    }
    const [member] = await db<IMember[]>`
        update members
        set name = ${next.name}, role = ${next.role}, color = ${next.color}, photo_file_id = ${next.photoFileId}
        where id = ${id}
        returning id, name, role, color, photo_file_id
    `
    return member
})
