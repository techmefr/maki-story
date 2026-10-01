export default defineNuxtPlugin(() => {
    const { check } = useConnectivity()
    window.addEventListener('online', () => void check())
    window.addEventListener('offline', () => void check())
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            void check()
        }
    })
    if (!navigator.onLine) {
        void check()
    }
})
