import type { H3Event } from 'h3'
import { getDb } from './db'

const WINDOW_MINUTES = 15
const MAX_FAILURES_PER_ACCOUNT = 5
const MAX_FAILURES_PER_IP = 60

const buckets = (event: H3Event, email: string): { account: string; ip: string } => {
    const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
    return { account: `account:${email}`, ip: `ip:${ip}` }
}

const countFailures = async (bucket: string): Promise<{ count: number; retryAfterSeconds: number }> => {
    const [row] = await getDb()<{ count: number; retryAfterSeconds: number | null }[]>`
        select count(*)::int as count,
            ceil(extract(epoch from (min(created_at) + make_interval(mins => ${WINDOW_MINUTES}) - now())))::int as retry_after_seconds
        from login_failures
        where bucket = ${bucket} and created_at > now() - make_interval(mins => ${WINDOW_MINUTES})
    `
    return { count: row?.count ?? 0, retryAfterSeconds: Math.max(row?.retryAfterSeconds ?? 0, 1) }
}

export const assertNotThrottled = async (event: H3Event, email: string): Promise<void> => {
    const { account, ip } = buckets(event, email)
    const [accountCount, ipCount] = await Promise.all([countFailures(account), countFailures(ip)])
    const waits: number[] = []
    if (accountCount.count >= MAX_FAILURES_PER_ACCOUNT) {
        waits.push(accountCount.retryAfterSeconds)
    }
    if (ipCount.count >= MAX_FAILURES_PER_IP) {
        waits.push(ipCount.retryAfterSeconds)
    }
    if (waits.length > 0) {
        const retryAfterSeconds = Math.max(...waits)
        setResponseHeader(event, 'Retry-After', retryAfterSeconds)
        throw createError({
            statusCode: 429,
            statusMessage: 'Too many attempts, try again later',
            data: { retryAfterSeconds },
        })
    }
}

export const recordFailure = async (event: H3Event, email: string): Promise<void> => {
    const { account, ip } = buckets(event, email)
    const db = getDb()
    await db`insert into login_failures (bucket) values (${account}), (${ip})`
    await db`delete from login_failures where created_at < now() - interval '1 day'`
}

export const clearFailures = async (email: string): Promise<void> => {
    await getDb()`delete from login_failures where bucket = ${`account:${email}`}`
}

const ipBucket = (event: H3Event, scope: string): string => `ip:${scope}:${getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'}`

export const assertIpBudget = async (event: H3Event, scope: string, max: number): Promise<void> => {
    if ((await countFailures(ipBucket(event, scope))).count >= max) {
        throw createError({ statusCode: 429, statusMessage: 'Too many attempts, try again later' })
    }
}

export const recordIpHit = async (event: H3Event, scope: string): Promise<void> => {
    const db = getDb()
    await db`insert into login_failures (bucket) values (${ipBucket(event, scope)})`
    await db`delete from login_failures where created_at < now() - interval '1 day'`
}
