export default defineNuxtPlugin(nuxtApp => {
    const { isChild } = useCurrentMember()
    const { refresh } = useAccess()
    const config = useRuntimeConfig()
    const route = useRoute()
    const isDeferring = useState<boolean>('access-defer-lock', () => false)
    let isClosing = false
    let isPending = false

    const lockScreen = async (): Promise<void> => {
        if (isClosing) {
            return
        }
        isClosing = true
        window.dispatchEvent(new Event(ACCESS_CLOSING_EVENT))
        await new Promise(resolve => setTimeout(resolve, ACCESS_FADE_MS))
        await nuxtApp.runWithContext(() => navigateTo('/kid/locked'))
        isClosing = false
    }

    const tick = async (): Promise<void> => {
        if (!isChild.value) {
            return
        }
        const result = await refresh()
        if (!result.isAllowed && route.path !== '/kid/locked') {
            if (isDeferring.value) {
                isPending = true
                return
            }
            await lockScreen()
        } else if (result.isAllowed && route.path === '/kid/locked') {
            await nuxtApp.runWithContext(() => navigateTo('/kid'))
        }
    }

    watch(isDeferring, value => {
        if (!value && isPending) {
            isPending = false
            void tick()
        }
    })

    nuxtApp.hook('app:mounted', () => {
        void preloadRouteComponents('/kid/locked')
        void import('~/layouts/blank.vue')
    })

    window.setInterval(tick, Number(config.public.accessPollMs))
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            void tick()
        }
    })
    window.addEventListener('online', () => void tick())
})
