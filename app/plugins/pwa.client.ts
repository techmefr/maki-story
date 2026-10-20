import { useAppUpdate } from '~~/technical/Storage/app/composables/useAppUpdate'

export default defineNuxtPlugin(() => {
    const updates = useAppUpdate()
    if (!updates.isSupported) return
    void updates.initialize().catch(() => undefined)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void updates.check()
    })
    window.addEventListener('online', () => void updates.check())
    window.addEventListener('pageshow', event => {
        if (event.persisted) void updates.check()
    })
})
