import { APPEARANCES, isAppearance, readAppearance, saveAppearance } from '~~/shared/utils/appearance'
import type { TAppearance } from '~~/shared/utils/appearance'

export const useAppearance = () => {
    const appearance = useState<TAppearance>('appearance', () => 'forest')
    const profileId = useState<string | null>('appearance-profile', () => null)
    const apply = (value: TAppearance): void => {
        appearance.value = value
        if (import.meta.client) document.documentElement.dataset.appearance = value
    }
    const restore = (id: string | null): void => {
        profileId.value = id
        try {
            apply(readAppearance(localStorage, id))
        } catch {
            apply('forest')
        }
    }
    const choose = (value: TAppearance): void => {
        if (!isAppearance(value)) return
        apply(value)
        try {
            saveAppearance(localStorage, profileId.value, value)
        } catch {
            return
        }
    }
    return { appearance, appearances: APPEARANCES, restore, choose }
}
