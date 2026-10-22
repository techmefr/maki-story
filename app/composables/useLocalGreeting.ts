export const useLocalGreeting = () => {
    const isEvening = ref(false)
    let timer: ReturnType<typeof setInterval> | undefined
    const refresh = (): void => {
        const hour = new Date().getHours()
        isEvening.value = hour >= 18 || hour < 5
    }
    onMounted(() => {
        refresh()
        timer = setInterval(refresh, 60000)
        document.addEventListener('visibilitychange', refresh)
    })
    onBeforeUnmount(() => {
        clearInterval(timer)
        document.removeEventListener('visibilitychange', refresh)
    })
    return { isEvening }
}
