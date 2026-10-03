import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64
const SALT_BYTES = 16
const PREFIX = 'scrypt'

const derive = (password: string, salt: Buffer): Promise<Buffer> => {
    return new Promise((resolve, reject) => {
        scrypt(password, salt, KEY_LENGTH, (error, key) => (error ? reject(error) : resolve(key)))
    })
}

export const hashPassword = async (password: string): Promise<string> => {
    const salt = randomBytes(SALT_BYTES)
    const key = await derive(password, salt)
    return `${PREFIX}$${salt.toString('base64url')}$${key.toString('base64url')}`
}

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
    const [prefix, saltText, keyText] = stored.split('$')
    if (prefix !== PREFIX || !saltText || !keyText) {
        return false
    }
    const expected = Buffer.from(keyText, 'base64url')
    const actual = await derive(password, Buffer.from(saltText, 'base64url'))
    return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export const DUMMY_HASH = `${PREFIX}$${Buffer.alloc(SALT_BYTES).toString('base64url')}$${Buffer.alloc(KEY_LENGTH).toString('base64url')}`
