import { createSign, generateKeyPairSync } from 'node:crypto'
import type { KeyObject } from 'node:crypto'
import { isOAuthFake } from '../../../shared/utils/oauth'
import { sign } from '../session'
import { FAKE_ISSUER } from './providers'

const KEY_ID = 'fake-key'
const CODE_TTL_MS = 120_000
const TOKEN_TTL_SECONDS = 600

export interface IFakeClaims {
    sub: string
    email: string
    email_verified: boolean
    given_name?: string
    state?: string
    user?: string
}

export interface IFakeCode {
    claims: IFakeClaims
    nonce: string
    challenge: string
    redirectUri: string
    clientId: string
    exp: number
}

interface IKeyPair {
    publicKey: KeyObject
    privateKey: KeyObject
}

let keys: IKeyPair | null = null

const keyPair = (): IKeyPair => {
    keys ??= generateKeyPairSync('rsa', { modulusLength: 2048 })
    return keys
}

export const assertFakeEnabled = (): void => {
    if (!isOAuthFake(process.env)) {
        throw createError({ statusCode: 404, statusMessage: 'Not found' })
    }
}

export const fakeJwks = (): { keys: object[] } => {
    return { keys: [{ ...keyPair().publicKey.export({ format: 'jwk' }), kid: KEY_ID, alg: 'RS256', use: 'sig' }] }
}

export const defaultFakeClaims = (): IFakeClaims => ({ sub: 'fake-subject', email: 'fake@example.test', email_verified: true })

export const issueFakeCode = (data: Omit<IFakeCode, 'exp'>): string => {
    const encoded = Buffer.from(JSON.stringify({ ...data, exp: Date.now() + CODE_TTL_MS })).toString('base64url')
    return `${encoded}.${sign(encoded)}`
}

export const readFakeCode = (code: string): IFakeCode | null => {
    const [encoded, signature] = code.split('.')
    if (!encoded || !signature || sign(encoded) !== signature) {
        return null
    }
    const data = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as IFakeCode
    return data.exp > Date.now() ? data : null
}

export const issueFakeIdToken = (data: IFakeCode): string => {
    const now = Math.floor(Date.now() / 1000)
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', kid: KEY_ID })).toString('base64url')
    const { state: _state, user: _user, ...claims } = data.claims
    const payload = Buffer.from(
        JSON.stringify({ ...claims, iss: FAKE_ISSUER, aud: data.clientId, iat: now, exp: now + TOKEN_TTL_SECONDS, nonce: data.nonce }),
    ).toString('base64url')
    const signature = createSign('RSA-SHA256').update(`${header}.${payload}`).sign(keyPair().privateKey)
    return `${header}.${payload}.${signature.toString('base64url')}`
}
