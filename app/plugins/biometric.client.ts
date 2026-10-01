export default defineNuxtPlugin(() => {
    const { register } = useProfileUnlockers()
    register(useBiometric().unlocker)
})
