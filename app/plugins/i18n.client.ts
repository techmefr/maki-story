export default defineNuxtPlugin(async () => {
    const { setLocale } = useI18n()
    await setLocale(initialLocale())
})
