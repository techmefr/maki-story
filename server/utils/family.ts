import type { H3Event } from 'h3'
import type { Sql } from 'postgres'
import { readSession } from '~~/technical/Auth/server/utils/session'
import type { ISession } from '~~/technical/Auth/server/utils/session'
import { badRequest } from './validate'

export const requireSession = (event: H3Event): ISession => {
    const session = readSession(event)
    if (!session) {
        throw createError({ statusCode: 401, statusMessage: 'Not signed in' })
    }
    return session
}

export const requireFamily = (event: H3Event): string => requireSession(event).familyId

export const requireMember = (event: H3Event): string => {
    const { memberId } = requireSession(event)
    if (!memberId) {
        throw createError({ statusCode: 403, statusMessage: 'Choose a profile first' })
    }
    return memberId
}

export const assertFilesInFamily = async (db: Sql, familyId: string, fileIds: string[]): Promise<void> => {
    const unique = [...new Set(fileIds)]
    if (unique.length === 0) {
        return
    }
    const rows = await db<{ id: string }[]>`select id from files where family_id = ${familyId} and id in ${db(unique)}`
    if (rows.length !== unique.length) {
        badRequest('Unknown file')
    }
}

export const assertMembersInFamily = async (db: Sql, familyId: string, memberIds: string[]): Promise<void> => {
    const unique = [...new Set(memberIds)]
    if (unique.length === 0) {
        return
    }
    const rows = await db<{ id: string }[]>`
        select id from members where family_id = ${familyId} and deleted_at is null and id in ${db(unique)}
    `
    if (rows.length !== unique.length) {
        badRequest('Unknown member')
    }
}
