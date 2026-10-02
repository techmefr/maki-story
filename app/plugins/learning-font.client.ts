export default defineNuxtPlugin(nuxtApp => {
    const { restore } = useLearningFont()
    restore()
    nuxtApp.hook('app:mounted', restore)
})
