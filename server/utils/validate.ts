import { VOICE_COLORS } from '../../shared/utils/voices'

const MEMBER_ROLES: MemberRole[] = ['parent', 'relative', 'child']

export const badRequest = (message: string): never => {
    throw createError({ statusCode: 400, statusMessage: message })
}

export const notFound = (message: string): never => {
    throw createError({ statusCode: 404, statusMessage: message })
}

export const isVoiceColor = (value: unknown): value is VoiceColorId => {
    return VOICE_COLORS.some(color => color.id === value)
}

export const isMemberRole = (value: unknown): value is MemberRole => {
    return MEMBER_ROLES.includes(value as MemberRole)
}

export const isNonEmptyString = (value: unknown): value is string => {
    return typeof value === 'string' && value.trim().length > 0
}

export const normalizeEmail = (value: unknown): string => {
    return typeof value === 'string' ? value.normalize('NFC').trim().toLowerCase() : ''
}

export const requireParam = (event: Parameters<typeof getRouterParam>[0], name: string): string => {
    const value = getRouterParam(event, name)
    return value ?? badRequest(`Missing ${name}`)
}
