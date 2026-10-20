const FOLIAGE_KEY = 'tantara-foliage-motion'

export const useFoliageMotion = () => {
    const isFoliageEnabled = useState<boolean>('foliage-motion', () => {
        if (!import.meta.client) {
            return true
        }
        try {
            return localStorage.getItem(FOLIAGE_KEY) !== 'off'
        } catch {
            return true
        }
    })

    const setFoliageEnabled = (enabled: boolean): void => {
        isFoliageEnabled.value = enabled
        try {
            localStorage.setItem(FOLIAGE_KEY, enabled ? 'on' : 'off')
        } catch {
            return
        }
    }

    return { isFoliageEnabled, setFoliageEnabled }
}
