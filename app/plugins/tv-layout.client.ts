const TV_PATTERN = /(Android TV|SMART-TV|SmartTV|AFT[A-Z]|BRAVIA|Tizen|Web0S|HbbTV|CrKey)/i
const TV_KEY = 'tantara-tv'

const readFlag = (): boolean => {
    try {
        return new URLSearchParams(location.search).get('tv') === '1' || localStorage.getItem(TV_KEY) === '1'
    } catch (_error) {
        return false
    }
}

export default defineNuxtPlugin(() => {
    if (TV_PATTERN.test(navigator.userAgent) || readFlag()) {
        document.documentElement.classList.add('tv')
    }
})
