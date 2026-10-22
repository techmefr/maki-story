export const APPEARANCES = ['forest', 'notebook', 'library'] as const
export type TAppearance = (typeof APPEARANCES)[number]

type TAppearanceStorage = Pick<Storage, 'getItem' | 'setItem'>
const DEVICE_KEY = 'tantara-appearance'
const profileKey = (profileId: string | null): string => profileId === null ? DEVICE_KEY : `${DEVICE_KEY}:profile:${profileId}`

export const isAppearance = (value: unknown): value is TAppearance => APPEARANCES.some(appearance => appearance === value)

export const readAppearance = (storage: TAppearanceStorage, profileId: string | null): TAppearance => {
    try {
        const value = storage.getItem(profileKey(profileId))
        return isAppearance(value) ? value : 'forest'
    } catch {
        return 'forest'
    }
}

export const saveAppearance = (storage: TAppearanceStorage, profileId: string | null, value: TAppearance): void => {
    try {
        storage.setItem(profileKey(profileId), value)
        storage.setItem(DEVICE_KEY, value)
    } catch {
        return
    }
}
