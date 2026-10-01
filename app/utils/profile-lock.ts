export const PROFILE_IDLE_LOCK_MS = 30_000

const UNLOCKED_KEY = 'tantara-profile-unlocked'
const HIDDEN_AT_KEY = 'tantara-hidden-at'

const read = (key: string): string | null => {
    try {
        return window.sessionStorage.getItem(key)
    } catch (_error) {
        return null
    }
}

const write = (key: string, value: string | null): void => {
    try {
        if (value === null) {
            window.sessionStorage.removeItem(key)
        } else {
            window.sessionStorage.setItem(key, value)
        }
    } catch (_error) {
        console.warn('Le stockage de session est indisponible')
    }
}

export const markProfileUnlocked = (): void => write(UNLOCKED_KEY, '1')

export const markProfileLocked = (): void => {
    write(UNLOCKED_KEY, null)
    write(HIDDEN_AT_KEY, null)
}

export const isProfileUnlockedInSession = (): boolean => read(UNLOCKED_KEY) === '1'

export const markAppHidden = (): void => write(HIDDEN_AT_KEY, String(Date.now()))

export const takeHiddenDuration = (): number => {
    const hiddenAt = Number(read(HIDDEN_AT_KEY))
    write(HIDDEN_AT_KEY, null)
    return Number.isFinite(hiddenAt) && hiddenAt > 0 ? Date.now() - hiddenAt : 0
}
