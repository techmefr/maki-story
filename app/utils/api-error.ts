interface IErrorShape {
    statusMessage?: string
    data?: { statusMessage?: string; message?: string }
}

const serverMessageOf = (error: unknown): string | null => {
    const shape = (error ?? {}) as IErrorShape
    return shape.statusMessage ?? shape.data?.statusMessage ?? shape.data?.message ?? null
}

export const errorText = (error: unknown, fallbackKey: string): string => {
    const { t } = useI18n()
    const message = serverMessageOf(error)
    if (message === UNREACHABLE_MESSAGE) {
        return t('errors.unreachable')
    }
    const key = message === null ? null : serverMessageKey(message)
    return key === null ? t(fallbackKey) : t(key)
}

export const apiErrorMessage = (error: unknown, fallback: string): string => {
    const { t } = useI18n()
    return serverMessageOf(error) === UNREACHABLE_MESSAGE ? t('errors.unreachable') : fallback
}
