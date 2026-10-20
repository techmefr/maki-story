export const UPDATE_POLL_MS = 60000

export const startUpdatePolling = (canCheck: () => boolean, check: () => Promise<unknown>): (() => void) => {
    let isRunning = false
    const timer = setInterval(() => {
        if (!canCheck() || isRunning) return
        isRunning = true
        void check().catch(() => undefined).finally(() => { isRunning = false })
    }, UPDATE_POLL_MS)
    return () => clearInterval(timer)
}
