export default defineNuxtPlugin(() => {
    const isOnline = useState<boolean>('is-online', () => true)
    isOnline.value = navigator.onLine
    window.addEventListener('online', () => {
        isOnline.value = true
    })
    window.addEventListener('offline', () => {
        isOnline.value = false
    })
})
