export default defineNuxtPlugin(nuxtApp => {
    const { restore } = useTextSize()
    const { currentId } = useCurrentMember()
    restore()
    watch(currentId, restore)
    nuxtApp.hook('app:mounted', restore)
})
