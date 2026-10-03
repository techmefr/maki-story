const TICK_MS = 30000

let consumers = 0
let timer: ReturnType<typeof setInterval> | null = null

export const useMessageClock = () => {
    const now = useState<number>('message-clock', () => Date.now())

    onMounted(() => {
        now.value = Date.now()
        consumers += 1
        if (timer === null) {
            timer = setInterval(() => {
                now.value = Date.now()
            }, TICK_MS)
        }
    })

    onBeforeUnmount(() => {
        consumers = Math.max(0, consumers - 1)
        if (consumers === 0 && timer !== null) {
            clearInterval(timer)
            timer = null
        }
    })

    return now
}
