const STORAGE_KEY = 'tantara-sound'

export const useSoundSetting = () => {
    const isSoundOn = useState<boolean>('sound-on', () => true)

    onMounted(() => {
        try {
            isSoundOn.value = localStorage.getItem(STORAGE_KEY) !== 'off'
        } catch (_error) {
            isSoundOn.value = true
        }
    })

    const toggleSound = (): void => {
        isSoundOn.value = !isSoundOn.value
        try {
            localStorage.setItem(STORAGE_KEY, isSoundOn.value ? 'on' : 'off')
        } catch (_error) {
            console.warn('Le réglage du son n a pas pu être gardé')
        }
    }

    return { isSoundOn, toggleSound }
}
