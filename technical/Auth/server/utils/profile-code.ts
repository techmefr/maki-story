import type { H3Event } from 'h3'
import type { Sql } from 'postgres'
import { isCodeKindAllowed, isMemberCodeKind, isValidCodeValue } from '~~/shared/utils/code'
import { getDb } from '~~/server/utils/db'
import { requireSession } from '~~/server/utils/family'
import { hashPassword, verifyPassword } from '~~/technical/Auth/server/utils/password'
import { badRequest } from '~~/server/utils/validate'

export const MAX_CODE_ATTEMPTS = 5
export const CODE_LOCK_MINUTES = 5

interface ICodeRow {
    id: string
    role: MemberRole
    pinHash: string | null
    codeKind: MemberCodeKind | null
    codeEnabled: boolean
    isLocked: boolean
    status: MemberStatus
}

const material = (kind: MemberCodeKind, value: string): string => `${kind}:${value}`

export const readCodeInput = (input: unknown, role: MemberRole): IMemberCodeInput => {
    const candidate = (input ?? {}) as Partial<IMemberCodeInput>
    if (!isMemberCodeKind(candidate.kind) || !isCodeKindAllowed(candidate.kind, role) || !isValidCodeValue(candidate.kind, candidate.value)) {
        return badRequest('Invalid code')
    }
    return { kind: candidate.kind, value: candidate.value }
}

export const hashCode = (input: IMemberCodeInput): Promise<string> => hashPassword(material(input.kind, input.value))

export const loadCodeRow = async (db: Sql, familyId: string, memberId: string): Promise<ICodeRow | null> => {
    const [row] = await db<ICodeRow[]>`
        select id, role, status, pin_hash, code_kind, code_enabled, coalesce(code_locked_until > now(), false) as is_locked
        from members where id = ${memberId} and family_id = ${familyId} and deleted_at is null and source_member_id is null
    `
    return row ?? null
}

export const verifyMemberCode = async (db: Sql, familyId: string, row: ICodeRow, code: unknown): Promise<void> => {
    if (row.isLocked) {
        throw createError({ statusCode: 429, statusMessage: 'Too many attempts, try again later' })
    }
    if (!row.pinHash || !row.codeKind || typeof code !== 'string') {
        throw createError({ statusCode: 403, statusMessage: 'Wrong code' })
    }
    if (await verifyPassword(material(row.codeKind, code), row.pinHash)) {
        await db`
            update members set code_failed_attempts = 0, code_locked_until = null
            where id = ${row.id} and family_id = ${familyId} and (code_failed_attempts > 0 or code_locked_until is not null)
        `
        return
    }
    const [failure] = await db<{ isLocked: boolean }[]>`
        update members
        set code_failed_attempts = case when code_failed_attempts + 1 >= ${MAX_CODE_ATTEMPTS} then 0 else code_failed_attempts + 1 end,
            code_locked_until = case
                when code_failed_attempts + 1 >= ${MAX_CODE_ATTEMPTS} then now() + make_interval(mins => ${CODE_LOCK_MINUTES})
                else code_locked_until
            end
        where id = ${row.id} and family_id = ${familyId}
        returning coalesce(code_locked_until > now(), false) as is_locked
    `
    if (failure?.isLocked) {
        throw createError({ statusCode: 429, statusMessage: 'Too many attempts, try again later' })
    }
    throw createError({ statusCode: 403, statusMessage: 'Wrong code' })
}

export const storeMemberCode = async (db: Sql, familyId: string, memberId: string, input: IMemberCodeInput): Promise<void> => {
    const hash = await hashCode(input)
    await db`
        update members
        set pin_hash = ${hash}, code_kind = ${input.kind}, code_failed_attempts = 0, code_locked_until = null, code_enabled = true
        where id = ${memberId} and family_id = ${familyId}
    `
}

export const requireActor = async (event: H3Event): Promise<{ id: string; role: MemberRole; familyId: string }> => {
    const session = requireSession(event)
    const row = session.memberId ? await loadCodeRow(getDb(), session.familyId, session.memberId) : null
    if (!row) {
        throw createError({ statusCode: 403, statusMessage: 'Choose a profile first' })
    }
    return { id: row.id, role: row.role, familyId: session.familyId }
}
