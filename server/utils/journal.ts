import { randomUUID } from 'node:crypto'
import type { H3Event } from 'h3'
import type { Sql, TransactionSql } from 'postgres'
import { getDb } from './db'
import type { IActor } from './permissions'

export type JournalOutcome = 'SUCCESS' | 'DENIED' | 'FAILURE'

export interface IJournalEntry {
    familyId: string
    action: string
    entityType?: string
    entityId?: string | null
    actorMemberId?: string | null
    actorAccountId?: string | null
    targetMemberId?: string | null
    before?: Record<string, unknown>
    after?: Record<string, unknown>
    outcome?: JournalOutcome
    requestId?: string | null
}

export interface IErrorEntry {
    familyId?: string | null
    source: 'SERVER' | 'CLIENT'
    route?: string
    method?: string
    status?: number | null
    message?: string
    appVersion?: string
    userAgent?: string
    role?: string | null
    requestId?: string | null
}

type Db = Sql | TransactionSql

const SENSITIVE_KEY = /pass|secret|token|code|pin|hash|key|auth|cookie|session|audio|text|body|birth|email|phone|contact|endpoint|content|payload/i
const MAX_STRING = 160
const MAX_DEPTH = 2
const MAX_KEYS = 20
const REDACTED = '[redacted]'
const EMAIL_PATTERN = /[^\s@]+@[^\s@]+\.[^\s@]+/g
const BEARER_PATTERN = /(bearer|basic)\s+[a-z0-9._~+/=-]+/gi
const LONG_TOKEN_PATTERN = /\b[A-Za-z0-9_-]{32,}\b/g

export const scrubText = (value: string): string => {
    return value.replace(EMAIL_PATTERN, REDACTED).replace(BEARER_PATTERN, REDACTED).replace(LONG_TOKEN_PATTERN, REDACTED).slice(0, MAX_STRING)
}

export const scrubValue = (value: unknown, depth = 0): unknown => {
    if (value === null || typeof value === 'number' || typeof value === 'boolean') {
        return value
    }
    if (typeof value === 'string') {
        return scrubText(value)
    }
    if (depth >= MAX_DEPTH || typeof value !== 'object') {
        return undefined
    }
    if (Array.isArray(value)) {
        return value.slice(0, MAX_KEYS).map(item => scrubValue(item, depth + 1))
    }
    const result: Record<string, unknown> = {}
    for (const [key, entry] of Object.entries(value as Record<string, unknown>).slice(0, MAX_KEYS)) {
        result[key] = SENSITIVE_KEY.test(key) ? REDACTED : scrubValue(entry, depth + 1)
    }
    return result
}

export const scrubRecord = (value: Record<string, unknown> | undefined): Record<string, unknown> | null => {
    return value === undefined ? null : (scrubValue(value) as Record<string, unknown>)
}

export const requestIdOf = (event: H3Event): string => {
    const context = event.context as { requestId?: string }
    context.requestId ??= randomUUID()
    return context.requestId
}

export const actorEntry = (actor: IActor): Pick<IJournalEntry, 'familyId' | 'actorMemberId' | 'actorAccountId'> => ({
    familyId: actor.familyId,
    actorMemberId: actor.memberId,
    actorAccountId: actor.accountId,
})

export const record = async (event: H3Event | null, entry: IJournalEntry, db: Db = getDb()): Promise<void> => {
    const requestId = entry.requestId ?? (event ? requestIdOf(event) : null)
    await db`
        insert into audit_log (family_id, actor_member_id, actor_account_id, target_member_id, action, entity_type, entity_id, before, after, request_id, outcome, details)
        values (${entry.familyId}, ${entry.actorMemberId ?? null}, ${entry.actorAccountId ?? null}, ${entry.targetMemberId ?? null}, ${entry.action},
            ${entry.entityType ?? null}, ${entry.entityId ?? null}, ${db.json(scrubRecord(entry.before) as never)}, ${db.json(scrubRecord(entry.after) as never)},
            ${requestId}, ${entry.outcome ?? 'SUCCESS'}, ${db.json({} as never)})
    `
}

export const recordError = async (event: H3Event | null, entry: IErrorEntry, db: Db = getDb()): Promise<void> => {
    const requestId = entry.requestId ?? (event ? requestIdOf(event) : null)
    await db`
        insert into error_log (family_id, source, route, method, status, message, fingerprint, user_agent, app_version, role, request_id)
        values (${entry.familyId ?? null}, ${entry.source}, ${scrubText(entry.route ?? '').split('?')[0] ?? ''}, ${entry.method ?? ''}, ${entry.status ?? null},
            ${scrubText(entry.message ?? '')}, ${scrubText(`${entry.source}:${entry.method ?? ''}:${entry.route ?? ''}:${entry.status ?? ''}`)},
            ${scrubText(entry.userAgent ?? '').slice(0, 120)}, ${scrubText(entry.appVersion ?? '').slice(0, 40)}, ${entry.role ?? null}, ${requestId})
    `
}
