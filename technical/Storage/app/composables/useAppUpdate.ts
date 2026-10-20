import { canReloadForUpdate, UPDATE_CHECK_MS, withinUpdateDeadline } from '~~/shared/utils/appUpdate'

const RELOAD_KEY = 'tantara-update-reloaded-at'
let registration: Promise<ServiceWorkerRegistration> | null = null
let checkInFlight: Promise<boolean> | null = null
let initialized = false
let reloading = false

export const useAppUpdate = () => {
    const isAvailable = useState('app-update-available', () => false)
    const isChecking = useState('app-update-checking', () => false)
    const isApplying = useState('app-update-applying', () => false)
    const status = useState<'idle' | 'current' | 'offline' | 'failed'>('app-update-status', () => 'idle')
    const isSupported = import.meta.client && !import.meta.dev && 'serviceWorker' in navigator

    const initialize = (): Promise<ServiceWorkerRegistration> => {
        if (!isSupported) return Promise.reject(new Error('Service worker unavailable'))
        if (!initialized) {
            initialized = true
            let wasControlled = navigator.serviceWorker.controller !== null
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (wasControlled) isAvailable.value = true
                wasControlled = true
                if (isApplying.value) reload()
            })
        }
        if (!registration) {
            registration = navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then(result => {
                const observe = (): void => {
                    const worker = result.installing
                    if (!worker) return
                    worker.addEventListener('statechange', () => {
                        if (worker.state === 'installed' && navigator.serviceWorker.controller) isAvailable.value = true
                    })
                }
                result.addEventListener('updatefound', observe)
                observe()
                if (result.waiting) isAvailable.value = true
                return result
            }).catch(error => {
                registration = null
                throw error
            })
        }
        return registration
    }

    const reload = (): void => {
        if (reloading) return
        reloading = true
        try {
            sessionStorage.setItem(RELOAD_KEY, String(Date.now()))
        } catch {
            status.value = 'idle'
        }
        window.location.reload()
    }

    const check = (): Promise<boolean> => {
        if (!isSupported) return Promise.resolve(false)
        if (checkInFlight) return checkInFlight
        isChecking.value = true
        status.value = 'idle'
        checkInFlight = (async () => {
            try {
                const work = async (): Promise<void> => {
                    const result = await initialize()
                    if (result.waiting) isAvailable.value = true
                    await result.update()
                    const worker = result.installing
                    if (worker && !['installed', 'activated', 'redundant'].includes(worker.state)) {
                        await new Promise<void>(resolve => {
                            const changed = (): void => {
                                if (['installed', 'activated', 'redundant'].includes(worker.state)) {
                                    worker.removeEventListener('statechange', changed)
                                    resolve()
                                }
                            }
                            worker.addEventListener('statechange', changed)
                            changed()
                        })
                    }
                    if (result.waiting) isAvailable.value = true
                }
                await withinUpdateDeadline(work())
                if (!isAvailable.value) status.value = 'current'
            } catch {
                status.value = navigator.onLine ? 'failed' : 'offline'
            } finally {
                isChecking.value = false
                checkInFlight = null
            }
            return isAvailable.value
        })()
        return checkInFlight
    }

    const activate = async (): Promise<void> => {
        if (isApplying.value) return
        isApplying.value = true
        try {
            const result = await withinUpdateDeadline(initialize())
            if (!result.waiting) {
                reload()
                return
            }
            result.waiting.postMessage({ type: 'SKIP_WAITING' })
            setTimeout(() => {
                if (!reloading) {
                    isApplying.value = false
                    status.value = 'failed'
                }
            }, UPDATE_CHECK_MS)
        } catch {
            isApplying.value = false
            status.value = 'failed'
        }
    }

    const apply = async (): Promise<void> => {
        if (await check()) await activate()
    }

    const checkAtStartup = async (): Promise<void> => {
        if (!(await check())) return
        try {
            if (canReloadForUpdate(sessionStorage.getItem(RELOAD_KEY), Date.now())) await activate()
        } catch {
            return
        }
    }

    return { isAvailable, isChecking, isApplying, isSupported, status, initialize, check, apply, checkAtStartup }
}
