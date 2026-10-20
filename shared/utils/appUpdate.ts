export const UPDATE_CHECK_MS = 3000
export const UPDATE_RELOAD_COOLDOWN_MS = 60000

export const canReloadForUpdate = (previous: string | null, now: number): boolean => {
    const last = Number(previous)
    return previous === null || !Number.isFinite(last) || now - last >= UPDATE_RELOAD_COOLDOWN_MS
}

export const withinUpdateDeadline = async <T>(operation: Promise<T>, milliseconds = UPDATE_CHECK_MS): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
        return await Promise.race([
            operation,
            new Promise<never>((_resolve, reject) => {
                timer = setTimeout(() => reject(new Error('Update check timed out')), milliseconds)
            }),
        ])
    } finally {
        clearTimeout(timer)
    }
}
