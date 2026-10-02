const MAX_REPORTS_PER_LOAD = 10
const MAX_MESSAGE_CHARS = 160

export default defineNuxtPlugin(nuxtApp => {
    const config = useRuntimeConfig()
    let reported = 0
    const seen = new Set<string>()

    const report = (message: string): void => {
        const text = message.slice(0, MAX_MESSAGE_CHARS)
        if (reported >= MAX_REPORTS_PER_LOAD || seen.has(text)) {
            return
        }
        reported += 1
        seen.add(text)
        void $fetch(`${config.public.apiBase}/api/errors/client`, {
            method: 'POST',
            credentials: 'include',
            body: { route: window.location.pathname, message: text, appVersion: String(config.public.appVersion ?? '') },
        }).catch(() => undefined)
    }

    nuxtApp.hook('vue:error', error => report(error instanceof Error ? error.message : String(error)))
    window.addEventListener('error', event => report(event.message))
    window.addEventListener('unhandledrejection', event => report(event.reason instanceof Error ? event.reason.message : String(event.reason)))
})
