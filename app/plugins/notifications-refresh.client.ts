export default defineNuxtPlugin(nuxtApp => {
    const { current } = useCurrentMember()
    const { load } = useNotifications()
    let isLoading = false
    const refresh = async (): Promise<void> => {
        if (isLoading || !current.value || current.value.role === 'child' || document.visibilityState !== 'visible' || !navigator.onLine) {
            return
        }
        isLoading = true
        try {
            await load()
        } finally {
            isLoading = false
        }
    }
    const onVisible = (): void => { void refresh() }
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('online', onVisible)
    const timer = window.setInterval(onVisible, 60000)
    watch(() => current.value?.id, onVisible)
    nuxtApp.vueApp.onUnmount(() => {
        clearInterval(timer)
        document.removeEventListener('visibilitychange', onVisible)
        window.removeEventListener('online', onVisible)
    })
})
