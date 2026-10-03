import { createHash, randomBytes } from 'node:crypto'
import type { H3Event } from 'h3'
import type { Sql } from 'postgres'
import { safeEqual } from '~~/technical/Auth/server/utils/session'
import { assertNotThrottled, clearFailures, recordFailure } from '~~/technical/Auth/server/utils/throttle'

export const MAX_DEVICES_PER_MEMBER = 10
const MAX_FIELD_LENGTH = 200
const DUMMY_SECRET_HASH = '0'.repeat(64)

export const hashDeviceSecret = (secret: string): string => createHash('sha256').update(secret).digest('hex')

export const newDeviceSecret = (): string => randomBytes(32).toString('base64url')

export const readDeviceProof = (input: unknown): IDeviceProof | null => {
    const candidate = (input ?? {}) as Partial<IDeviceProof>
    const isValid = (value: unknown): value is string => typeof value === 'string' && value !== '' && value.length <= MAX_FIELD_LENGTH
    return isValid(candidate.id) && isValid(candidate.secret) ? { id: candidate.id, secret: candidate.secret } : null
}

export const verifyDeviceSecret = async (
    event: H3Event,
    db: Sql,
    familyId: string,
    memberId: string,
    input: unknown,
): Promise<void> => {
    const proof = readDeviceProof(input)
    const bucket = `device:${proof?.id ?? 'invalid'}`
    await assertNotThrottled(event, bucket)
    const [device] = proof
        ? await db<{ secretHash: string }[]>`
            select secret_hash from member_devices
            where id = ${proof.id} and member_id = ${memberId} and family_id = ${familyId} and revoked_at is null
        `
        : []
    const isValid = safeEqual(hashDeviceSecret(proof?.secret ?? ''), device?.secretHash ?? DUMMY_SECRET_HASH)
    if (!proof || !device || !isValid) {
        await recordFailure(event, bucket)
        throw createError({ statusCode: 403, statusMessage: 'Wrong device secret' })
    }
    await clearFailures(bucket)
    await db`update member_devices set last_used_at = now() where id = ${proof.id}`
}
