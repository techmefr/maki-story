import type { H3Event } from 'h3'
import { getDb } from './db'
import { requireSession } from './family'

export interface IActor {
    accountId: string
    familyId: string
    memberId: string | null
    role: MemberRole
}

const forbidden = (message: string): never => {
    throw createError({ statusCode: 403, statusMessage: message })
}

export const loadActor = async (event: H3Event): Promise<IActor> => {
    const session = requireSession(event)
    if (session.memberId === null) {
        return { accountId: session.accountId, familyId: session.familyId, memberId: null, role: 'child' }
    }
    const [member] = await getDb()<{ role: MemberRole }[]>`
        select role from members
        where id = ${session.memberId} and family_id = ${session.familyId} and deleted_at is null and status = 'active' and source_member_id is null
    `
    if (!member) {
        return forbidden('This profile is no longer available')
    }
    return { accountId: session.accountId, familyId: session.familyId, memberId: session.memberId, role: member.role }
}

export const requireRole = async (event: H3Event, ...roles: MemberRole[]): Promise<IActor> => {
    const actor = await loadActor(event)
    if (!roles.includes(actor.role)) {
        return forbidden('Your profile cannot do this')
    }
    return actor
}

export const requirePermission = async (event: H3Event, permission: Permission): Promise<IActor> => {
    return requireRole(event, ...ROLE_PERMISSIONS[permission])
}

export const requireAnyPermission = async (event: H3Event, ...permissions: Permission[]): Promise<IActor> => {
    const actor = await loadActor(event)
    if (!permissions.some(permission => can(actor.role, permission))) {
        return forbidden('Your profile cannot do this')
    }
    return actor
}

export const requireActorMember =(actor: IActor): string => {
    return actor.memberId ?? forbidden('Choose a profile first')
}

export const assertCanRecordLine = (actor: IActor, lineMemberId: string | null): void => {
    if (actor.role === 'relative' && lineMemberId !== actor.memberId) {
        forbidden('This line is not assigned to you')
    }
}

export const requireBookEditor = async (event: H3Event): Promise<IActor> => {
    const actor = await requirePermission(event, 'books.edit')
    if (actor.role === 'parent') {
        return actor
    }
    const bookId = getRouterParam(event, 'id') ?? ''
    const [book] = await getDb()<{ id: string }[]>`
        select id from books
        where id = ${bookId} and family_id = ${actor.familyId} and deleted_at is null and kind = 'solo' and solo_member_id = ${actor.memberId}
    `
    if (!book) {
        return forbidden('A relative can only edit their own single voice books')
    }
    return actor
}
