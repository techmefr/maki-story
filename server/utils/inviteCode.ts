import { randomInt } from 'node:crypto'
import { INVITE_CODE_ALPHABET, INVITE_CODE_LENGTH } from '../../shared/utils/sharing'

export const generateInviteCode = (): string => {
    let code = ''
    for (let index = 0; index < INVITE_CODE_LENGTH; index++) {
        code += INVITE_CODE_ALPHABET[randomInt(INVITE_CODE_ALPHABET.length)]
    }
    return code
}

export const normalizeInviteCode = (value: unknown): string => {
    return typeof value === 'string' ? value.trim().toLowerCase() : ''
}
