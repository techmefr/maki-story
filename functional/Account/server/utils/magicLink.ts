import { createHash } from 'node:crypto'

export const MAGIC_LINK_MINUTES = 15

export const hashMagicToken = (token: string): string => createHash('sha256').update(token).digest('hex')
