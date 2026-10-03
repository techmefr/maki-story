import { createPrivateKey, createSign } from 'node:crypto'
import { isFakeDelivery } from '~~/technical/Mail/server/utils/mail'

const SEND_TIMEOUT_MS = 4000
const VAPID_TTL_SECONDS = 3600
const VAPID_JWT_LIFETIME_SECONDS = 12 * 3600
const FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export interface IPushTarget {
    id: string
    platform: PushPlatform
    endpoint: string
}

export interface IPushMessage {
    title: string
    body: string
    kind: NotificationKind
}

export type PushOutcome = 'SENT' | 'GONE' | 'FAILED'

const base64url = (value: Buffer | string): string => Buffer.from(value).toString('base64url')

const signJwt = (header: object, claims: object, sign: (data: string) => Buffer): string => {
    const data = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claims))}`
    return `${data}.${base64url(sign(data))}`
}

export const isWebPushConfigured = (): boolean => isFakeDelivery() || (Boolean(process.env.VAPID_PUBLIC_KEY) && Boolean(process.env.VAPID_PRIVATE_KEY))

export const webPushPublicKey = (): string => process.env.VAPID_PUBLIC_KEY ?? ''

const vapidJwt = (audience: string): string => {
    const publicKey = Buffer.from(process.env.VAPID_PUBLIC_KEY ?? '', 'base64url')
    const key = createPrivateKey({
        format: 'jwk',
        key: {
            kty: 'EC',
            crv: 'P-256',
            d: process.env.VAPID_PRIVATE_KEY ?? '',
            x: base64url(publicKey.subarray(1, 33)),
            y: base64url(publicKey.subarray(33, 65)),
        },
    })
    return signJwt({ typ: 'JWT', alg: 'ES256' }, {
        aud: audience,
        exp: Math.floor(Date.now() / 1000) + VAPID_JWT_LIFETIME_SECONDS,
        sub: process.env.VAPID_SUBJECT ?? 'mailto:admin@example.com',
    }, data => createSign('SHA256').update(data).sign({ key, dsaEncoding: 'ieee-p1363' }))
}

const sendWebPush = async (target: IPushTarget): Promise<PushOutcome> => {
    if (!isWebPushConfigured()) {
        return 'FAILED'
    }
    try {
        const response = await fetch(target.endpoint, {
            method: 'POST',
            headers: {
                authorization: `vapid t=${vapidJwt(new URL(target.endpoint).origin)}, k=${process.env.VAPID_PUBLIC_KEY}`,
                ttl: String(VAPID_TTL_SECONDS),
                'content-length': '0',
            },
            signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
        })
        if (response.status === 404 || response.status === 410) {
            return 'GONE'
        }
        return response.ok ? 'SENT' : 'FAILED'
    } catch (_error) {
        return 'FAILED'
    }
}

interface IServiceAccount {
    client_email: string
    private_key: string
    project_id?: string
}

let fcmToken: { value: string; expiresAt: number } | null = null

const readServiceAccount = (): IServiceAccount | null => {
    try {
        return JSON.parse(process.env.FCM_SERVICE_ACCOUNT ?? '') as IServiceAccount
    } catch (_error) {
        return null
    }
}

export const isNativePushConfigured = (): boolean => isFakeDelivery() || readServiceAccount() !== null

const fcmAccessToken = async (account: IServiceAccount): Promise<string | null> => {
    if (fcmToken && fcmToken.expiresAt > Date.now() + 60_000) {
        return fcmToken.value
    }
    const now = Math.floor(Date.now() / 1000)
    const assertion = signJwt({ alg: 'RS256', typ: 'JWT' }, { iss: account.client_email, scope: FCM_SCOPE, aud: GOOGLE_TOKEN_URL, iat: now, exp: now + 3600 }, data =>
        createSign('RSA-SHA256').update(data).sign(account.private_key),
    )
    const response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
        signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
    })
    if (!response.ok) {
        return null
    }
    const payload = (await response.json()) as { access_token: string; expires_in: number }
    fcmToken = { value: payload.access_token, expiresAt: Date.now() + payload.expires_in * 1000 }
    return fcmToken.value
}

const sendNativePush = async (target: IPushTarget, message: IPushMessage): Promise<PushOutcome> => {
    const account = readServiceAccount()
    if (!account) {
        return 'FAILED'
    }
    try {
        const token = await fcmAccessToken(account)
        if (!token) {
            return 'FAILED'
        }
        const projectId = process.env.FCM_PROJECT_ID ?? account.project_id ?? ''
        const response = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
            method: 'POST',
            headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
            body: JSON.stringify({ message: { token: target.endpoint, notification: { title: message.title, body: message.body }, data: { kind: message.kind } } }),
            signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
        })
        if (response.status === 404) {
            return 'GONE'
        }
        return response.ok ? 'SENT' : 'FAILED'
    } catch (_error) {
        return 'FAILED'
    }
}

export const sendPush = async (target: IPushTarget, message: IPushMessage): Promise<PushOutcome> => {
    if (isFakeDelivery()) {
        return target.endpoint.includes('gone') ? 'GONE' : 'SENT'
    }
    return target.platform === 'WEB' ? sendWebPush(target) : sendNativePush(target, message)
}
