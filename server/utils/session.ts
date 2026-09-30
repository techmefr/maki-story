import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'

export const SESSION_COOKIE = 'tantara_session'
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30
const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_SECONDS * 1000

const secret = (): string => {
    return process.env.SESSION_SECRET ?? process.env.TEST_ACCESS_PASSWORD ?? ''
}

const sign = (payload: string): string => {
    return createHmac('sha256', secret()).update(payload).digest('base64url')
}

export const safeEqual = (a: string, b: string): boolean => {
    const left = Buffer.from(a)
    const right = Buffer.from(b)
    return left.length === right.length && timingSafeEqual(left, right)
}

export const createSessionToken = (): string => {
    const payload = String(Date.now() + SESSION_MAX_AGE_MS)
    return `${payload}.${sign(payload)}`
}

export const isValidSessionToken = (token: string | undefined): boolean => {
    if (!token || !secret()) {
        return false
    }
    const [payload, signature] = token.split('.')
    if (!payload || !signature || !safeEqual(signature, sign(payload))) {
        return false
    }
    return Number(payload) > Date.now()
}

export const startSession = (event: H3Event): void => {
    setCookie(event, SESSION_COOKIE, createSessionToken(), {
        httpOnly: true,
        secure: !import.meta.dev,
        sameSite: 'lax',
        maxAge: SESSION_MAX_AGE_SECONDS,
        path: '/',
    })
}

export const hasSession = (event: H3Event): boolean => {
    return isValidSessionToken(getCookie(event, SESSION_COOKIE))
}
