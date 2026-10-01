export default defineNuxtPlugin(nuxtApp => {
    const { isChild } = useCurrentMember()
    const { refresh } = useAccess()
    const config = useRuntimeConfig()
    const route = useRoute()
    let isClosing = false

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
            await lockScreen()
        } else if (result.isAllowed && route.path === '/kid/locked') {
            await nuxtApp.runWithContext(() => navigateTo('/kid'))
        }
    }

    window.setInterval(tick, Number(config.public.accessPollMs))
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            void tick()
        }
    })
})
