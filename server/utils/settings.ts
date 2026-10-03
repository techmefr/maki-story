import type { H3Event } from 'h3'
import { getDb } from './db'
import { loadCodeRow, requireActor } from '~~/technical/Auth/server/utils/profile-code'
import { notFound } from './validate'

export interface ISettingsScope {
    actor: { id: string; role: MemberRole; familyId: string }
    targetId: string
    targetRole: MemberRole
    isSelf: boolean
}

export const requireSettingsScope = async (event: H3Event, targetId: string): Promise<ISettingsScope> => {
    const actor = await requireActor(event)
    const target = await loadCodeRow(getDb(), actor.familyId, targetId)
    if (!target) {
        return notFound('Member not found')
    }
    const isSelf = actor.id === target.id
    const isParentOfChild = actor.role === 'parent' && target.role === 'child'
    if (!isSelf && !isParentOfChild) {
        throw createError({ statusCode: 403, statusMessage: 'Not allowed to edit this profile' })
    }
    return { actor, targetId: target.id, targetRole: target.role, isSelf }
}
