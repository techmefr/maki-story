const TV_PATTERN = /(Android TV|SMART-TV|SmartTV|AFT[A-Z]|BRAVIA|Tizen|Web0S|HbbTV|CrKey)/i
const TV_KEY = 'tantara-tv'
const TV_MIN_WIDTH = 1600

const readFlag = (): boolean => {
    try {
        return new URLSearchParams(location.search).get('tv') === '1' || localStorage.getItem(TV_KEY) === '1'
    } catch (_error) {
        return false
    }
}

const isNativeWithoutTouch = (): boolean => {
    const capacitor = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    return capacitor?.isNativePlatform?.() === true && navigator.maxTouchPoints === 0
}

const isTvDevice = (): boolean => TV_PATTERN.test(navigator.userAgent) || readFlag() || isNativeWithoutTouch()

export default defineNuxtPlugin(() => {
    const root = document.documentElement
    const apply = (): void => {
        root.classList.toggle('tv', isTvDevice() || window.innerWidth >= TV_MIN_WIDTH)
    }
    apply()
    window.addEventListener('resize', apply)
})
