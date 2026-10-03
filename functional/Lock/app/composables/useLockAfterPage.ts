export const useLockAfterPage = (isPlaying: () => boolean): void => {
    const isDeferring = useState<boolean>('access-defer-lock', () => false)
    watchEffect(() => {
        isDeferring.value = isPlaying()
    })
    onBeforeUnmount(() => {
        isDeferring.value = false
    })
}
