export default defineNuxtPlugin(() => {
    const { load, flush, FLUSH_INTERVAL_MS } = useOutbox()
    const { currentId } = useCurrentMember()
    const { isOnline } = useConnectivity()

    void load().then(flush)
    watch(currentId, () => void load().then(flush))
    watch(isOnline, value => {
        if (value) {
            void flush()
        }
    })
    window.setInterval(() => void flush(), FLUSH_INTERVAL_MS)
})
