import type { H3Event } from 'h3'
import { getDb } from './db'

const WINDOW_MINUTES = 15
const MAX_FAILURES_PER_ACCOUNT = 5
const MAX_FAILURES_PER_IP = 60

const buckets = (event: H3Event, email: string): { account: string; ip: string } => {
    const ip = getRequestIP(event, { xForwardedFor: true }) ?? 'unknown'
    return { account: `account:${email}`, ip: `ip:${ip}` }
}

const countFailures = async (bucket: string): Promise<number> => {
    const [row] = await getDb()<{ count: number }[]>`
        select count(*)::int as count from login_failures
        where bucket = ${bucket} and created_at > now() - make_interval(mins => ${WINDOW_MINUTES})
    `
    return row?.count ?? 0
}

export const assertNotThrottled = async (event: H3Event, email: string): Promise<void> => {
    const { account, ip } = buckets(event, email)
    const [accountCount, ipCount] = await Promise.all([countFailures(account), countFailures(ip)])
    if (accountCount >= MAX_FAILURES_PER_ACCOUNT || ipCount >= MAX_FAILURES_PER_IP) {
        throw createError({ statusCode: 429, statusMessage: 'Too many attempts, try again later' })
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
