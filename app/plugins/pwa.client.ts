export default defineNuxtPlugin(() => {
    if (import.meta.dev || !('serviceWorker' in navigator)) {
        return
    }
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(error => {
            console.warn('L’installation hors ligne n’a pas pu démarrer', error)
        })
    })
})
