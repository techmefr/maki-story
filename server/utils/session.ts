import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { getDb } from './db'

export const SESSION_COOKIE = 'tantara_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000

export interface ISession {
    accountId: string
    familyId: string
    memberId: string | null
    issuedAt: number
}

export type ISessionStart = Omit<ISession, 'issuedAt'> & { issuedAt?: number }

interface ISessionPayload {
    a: string
    f: string
    m: string | null
    i: number
    e: number
}

const secret = (): string => {
    const value = process.env.SESSION_SECRET ?? ''
    if (value === '') {
        throw createError({ statusCode: 500, statusMessage: 'SESSION_SECRET is not configured' })
    }
    return value
}

export const sign = (payload: string): string => {
    return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export const safeEqual = (a: string, b: string): boolean => {
    const left = Buffer.from(a)
    const right = Buffer.from(b)
    return left.length === right.length && timingSafeEqual(left, right)
}

export const createSessionToken = (session: ISessionStart): string => {
    const payload: ISessionPayload = {
        a: session.accountId,
        f: session.familyId,
        m: session.memberId,
        i: session.issuedAt ?? Date.now(),
        e: Date.now() + SESSION_MAX_AGE_MS,
    }
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
    return `${encoded}.${sign(encoded)}`
}

export const parseSessionToken = (token: string | undefined): ISession | null => {
    if (!token || !process.env.SESSION_SECRET) {
        return null
    }
    const [encoded, signature] = token.split('.')
    if (!encoded || !signature || !safeEqual(signature, sign(encoded))) {
        return null
    }
    try {
        const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as ISessionPayload
        if (typeof payload.a !== 'string' || typeof payload.f !== 'string' || !(payload.e > Date.now())) {
            return null
        }
        return {
            accountId: payload.a,
            familyId: payload.f,
            memberId: typeof payload.m === 'string' ? payload.m : null,
            issuedAt: typeof payload.i === 'number' ? payload.i : 0,
        }
    } catch (_error) {
        return null
    }
}

export const startSession = (event: H3Event, session: ISessionStart): void => {
    setCookie(event, SESSION_COOKIE, createSessionToken(session), {
        httpOnly: true,
        secure: !import.meta.dev,
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE_SECONDS,
        path: '/',
    })
}

export const readSession = (event: H3Event): ISession | null => {
    return parseSessionToken(getCookie(event, SESSION_COOKIE))
}

export const isSessionCurrent = async (session: ISession): Promise<boolean> => {
    const [account] = await getDb()<{ passwordChangedAt: Date | null }[]>`
        select password_changed_at from accounts where id = ${session.accountId}
    `
    if (!account) {
        return false
    }
    return account.passwordChangedAt === null || session.issuedAt >= account.passwordChangedAt.getTime()
}
