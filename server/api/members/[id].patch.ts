import { getDb, one } from '../../utils/db'
import { assertFilesInFamily, requireFamily } from '../../utils/family'
import { badRequest, isMemberRole, isNonEmptyString, isVoiceColor, notFound, requireParam } from '../../utils/validate'

interface IMemberPatch {
    name?: string
    role?: MemberRole
    color?: VoiceColorId
    photoFileId?: string | null
}

export default defineEventHandler(async (event): Promise<IMember> => {
    const familyId = requireFamily(event)
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
        select id, name, role, color, photo_file_id, status from members
        where id = ${id} and family_id = ${familyId} and deleted_at is null
    `
    if (!current) {
        return notFound('Member not found')
    }
    if (typeof body.photoFileId === 'string') {
        await assertFilesInFamily(db, familyId, [body.photoFileId])
    }
    const next = {
        name: body.name?.trim() ?? current.name,
        role: body.role ?? current.role,
        color: body.color ?? current.color,
        photoFileId: body.photoFileId === undefined ? current.photoFileId : body.photoFileId,
    }
    return one(await db<IMember[]>`
        update members
        set name = ${next.name}, role = ${next.role}, color = ${next.color}, photo_file_id = ${next.photoFileId}
        where id = ${id} and family_id = ${familyId}
        returning id, name, role, color, photo_file_id, status
    `)
})
