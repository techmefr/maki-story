export const useStepFocus = (source: () => unknown) => {
    const heading = ref<HTMLElement | null>(null)

    watch(source, async () => {
        await nextTick()
        heading.value?.focus()
    })

    return heading
}
