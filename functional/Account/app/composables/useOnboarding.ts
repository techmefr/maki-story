const STORAGE_KEY = 'tantara-onboarded'

export const hasSeenOnboarding = (): boolean => {
    try {
        return localStorage.getItem(STORAGE_KEY) === '1'
    } catch (_error) {
        return true
    }
}

export const markOnboardingSeen = (): void => {
    try {
        localStorage.setItem(STORAGE_KEY, '1')
    } catch (_error) {
        return
    }
}
