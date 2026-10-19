import { timingSafeEqual } from 'node:crypto'

export const isCronAuthorized = (authorization: string | undefined, secret: string | undefined): boolean => {
    if (!secret || !authorization) {
        return false
    }
    const supplied = Buffer.from(authorization)
    const expected = Buffer.from(`Bearer ${secret}`)
    return supplied.length === expected.length && timingSafeEqual(supplied, expected)
}
