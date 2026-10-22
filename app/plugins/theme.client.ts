export default defineNuxtPlugin(nuxtApp => {
    const { restore, refresh } = useTheme()
    const { currentId } = useCurrentMember()
    const scene = useAppearance()
    scene.restore(currentId.value)
    watch(currentId, id => scene.restore(id))
    restore()
    watch(currentId, restore)
    nuxtApp.hook('app:mounted', restore)
    if (typeof matchMedia === 'function') {
        matchMedia('(prefers-color-scheme: dark)').addEventListener('change', refresh)
    }
})
