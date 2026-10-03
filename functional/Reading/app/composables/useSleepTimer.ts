export const useSleepTimer = () => {
    const config = useRuntimeConfig()
    const choice = ref<SleepChoiceId | null>(null)
    let deadline = 0
    let fadeMs = 0
    let interval: ReturnType<typeof setInterval> | null = null
    let fadeHandler: ((ratio: number) => void) | null = null
    let expireHandler: (() => void) | null = null

    const clearTick = (): void => {
        if (interval !== null) {
            clearInterval(interval)
            interval = null
        }
    }

    const finish = (): void => {
        clearTick()
        choice.value = null
        expireHandler?.()
    }

    const tick = (): void => {
        const remaining = deadline - Date.now()
        if (remaining <= 0) {
            fadeHandler?.(0)
            finish()
            return
        }
        if (remaining < fadeMs) {
            fadeHandler?.(remaining / fadeMs)
        }
    }

    const cancel = (): void => {
        clearTick()
        choice.value = null
        fadeHandler?.(1)
    }

    const start = (id: SleepChoiceId): void => {
        cancel()
        choice.value = id
        const option = SLEEP_CHOICES.find(item => item.id === id)
        if (!option || option.minutes === null) {
            return
        }
        const total = option.minutes * Number(config.public.sleepMinuteMs)
        fadeMs = Math.min(Number(config.public.sleepFadeMs), total / 2)
        deadline = Date.now() + total
        interval = setInterval(tick, 100)
    }

    const consumePageEnd = (): boolean => {
        if (choice.value !== 'page') {
            return false
        }
        clearTick()
        choice.value = null
        return true
    }

    const check = (): void => {
        if (interval !== null) {
            tick()
        }
    }

    const onFade = (handler: (ratio: number) => void): void => {
        fadeHandler = handler
    }

    const onExpire = (handler: () => void): void => {
        expireHandler = handler
    }

    onMounted(() => document.addEventListener('visibilitychange', check))

    onBeforeUnmount(() => {
        document.removeEventListener('visibilitychange', check)
        clearTick()
        fadeHandler = null
        expireHandler = null
    })

    return { choice, start, cancel, consumePageEnd, onFade, onExpire }
}
