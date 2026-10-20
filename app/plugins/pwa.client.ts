import { useAppUpdate } from '~~/technical/Storage/app/composables/useAppUpdate'
import { startUpdatePolling } from '~~/shared/utils/updatePolling'

export default defineNuxtPlugin(nuxtApp => {
    const updates = useAppUpdate()
    if (!updates.isSupported) return
    void updates.initialize().catch(() => undefined)
    const canCheck = (): boolean => document.visibilityState === 'visible' && navigator.onLine && !updates.isApplying.value && !updates.isAvailable.value
    const check = (): void => {
        if (canCheck()) void updates.check()
    }
    const onPageShow = (event: PageTransitionEvent): void => {
        if (event.persisted) check()
    }
    document.addEventListener('visibilitychange', check)
    window.addEventListener('online', check)
    window.addEventListener('pageshow', onPageShow)
    const stop = startUpdatePolling(canCheck, updates.check)
    nuxtApp.vueApp.onUnmount(() => {
        stop()
        document.removeEventListener('visibilitychange', check)
        window.removeEventListener('online', check)
        window.removeEventListener('pageshow', onPageShow)
    })
})
