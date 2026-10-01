export default defineNuxtPlugin(nuxtApp => {
    const { currentId, lock } = useCurrentMember()

    const onVisibilityChange = async (): Promise<void> => {
        if (document.visibilityState === 'hidden') {
            markAppHidden()
            return
        }
        const hiddenFor = takeHiddenDuration()
        if (!currentId.value || hiddenFor < PROFILE_IDLE_LOCK_MS) {
            return
        }
        try {
            await lock()
        } catch (error) {
            console.error('Le profil n a pas pu être verrouillé', error)
            return
        }
        await nuxtApp.runWithContext(() => navigateTo('/profiles'))
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
})
