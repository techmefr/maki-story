export default defineNuxtPlugin(nuxtApp => {
    const { currentId, lock, select } = useCurrentMember()
    const personal = usePersonalDevice()

    const relockPersonal = async (): Promise<void> => {
        const device = personal.stored.value
        if (!device) {
            return
        }
        personal.relock()
        try {
            await select(device.memberId, { device: { id: device.id, secret: device.secret } })
        } catch (error) {
            console.error('L appareil personnel n a pas pu rouvrir le profil', error)
            personal.forget()
            await lock()
            await nuxtApp.runWithContext(() => navigateTo('/profiles'))
            return
        }
        await nuxtApp.runWithContext(() => navigateTo('/home'))
    }

    const onVisibilityChange = async (): Promise<void> => {
        if (document.visibilityState === 'hidden') {
            markAppHidden()
            return
        }
        const hiddenFor = takeHiddenDuration()
        if (!currentId.value || hiddenFor < PROFILE_IDLE_LOCK_MS) {
            return
        }
        if (personal.isPersonal.value) {
            await relockPersonal()
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
