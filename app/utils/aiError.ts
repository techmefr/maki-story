export const AI_UNAVAILABLE_KEY = 'ai.errors.unavailable'
export const AI_QUOTA_KEY = 'ai.errors.quota'

export const aiErrorKey = (error: unknown): string => {
    const status = (error as { statusCode?: number }).statusCode
    if (status === 429) {
        return AI_QUOTA_KEY
    }
    if (status === 503) {
        return AI_UNAVAILABLE_KEY
    }
    if (status === 403) {
        return 'ai.errors.forbidden'
    }
    if (status === 502) {
        return 'ai.errors.unusable'
    }
    return 'ai.errors.failed'
}
