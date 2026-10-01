export const useWakeLock = () => {
    const isActive = ref(false)
    let sentinel: WakeLockSentinel | null = null
    let isWanted = false

    const acquire = async (): Promise<void> => {
        if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') {
            return
        }
        try {
            sentinel = await navigator.wakeLock.request('screen')
            isActive.value = true
            sentinel.addEventListener('release', () => {
                isActive.value = false
                sentinel = null
            })
        } catch (_error) {
            isActive.value = false
        }
    }

    const request = async (): Promise<void> => {
        isWanted = true
        await acquire()
    }

    const release = async (): Promise<void> => {
        isWanted = false
        const current = sentinel
        sentinel = null
        isActive.value = false
        await current?.release().catch(() => undefined)
    }

    const onVisibility = (): void => {
        if (isWanted && !sentinel) {
            void acquire()
        }
    }

    onMounted(() => document.addEventListener('visibilitychange', onVisibility))
    onBeforeUnmount(() => {
        document.removeEventListener('visibilitychange', onVisibility)
        void release()
    })

    return { isActive, request, release }
}
