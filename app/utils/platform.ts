const APPLE_MOBILE_PATTERN = /iPhone|iPad|iPod/
const NON_SAFARI_PATTERN = /Chrome|Chromium|Edg|OPR|Firefox|FxiOS|CriOS/

export const detectAppleContext = (): boolean => {
    const agent = navigator.userAgent
    const capacitor = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    if (capacitor?.isNativePlatform?.()) {
        return true
    }
    if (APPLE_MOBILE_PATTERN.test(agent)) {
        return true
    }
    return /Macintosh/.test(agent) && /Safari/.test(agent) && !NON_SAFARI_PATTERN.test(agent)
}
