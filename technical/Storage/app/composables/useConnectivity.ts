const PROBE_TIMEOUT_MS = 5000
const RETRY_MIN_MS = 2000
const RETRY_MAX_MS = 30000

let retryTimer: ReturnType<typeof setTimeout> | null = null
let retryDelay = RETRY_MIN_MS
let inflight: Promise<boolean> | null = null

export const useConnectivity = () => {
    const config = useRuntimeConfig()
    const isOnline = useState<boolean>('is-online', () => true)

    const probe = async (): Promise<boolean> => {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS)
        try {
            await fetch(`${config.public.apiBase}/api/auth/me`, { cache: 'no-store', credentials: 'include', signal: controller.signal })
            return true
        } catch (_error) {
            return false
        } finally {
            clearTimeout(timer)
        }
    }

    const scheduleRetry = () => {
        if (retryTimer) {
            return
        }
        retryTimer = setTimeout(() => {
            retryTimer = null
            void check()
        }, retryDelay)
        retryDelay = Math.min(retryDelay * 2, RETRY_MAX_MS)
    }

    const check = async (): Promise<boolean> => {
        inflight ??= probe().finally(() => {
            inflight = null
        })
        const reachable = await inflight
        isOnline.value = reachable
        if (reachable) {
            retryDelay = RETRY_MIN_MS
            if (retryTimer) {
                clearTimeout(retryTimer)
                retryTimer = null
            }
        } else {
            scheduleRetry()
        }
        return reachable
    }

    return { isOnline, check }
}
