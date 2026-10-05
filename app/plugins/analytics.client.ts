declare global {
    interface Window {
        goatcounter?: {
            no_onload?: boolean
            count?: (options: { path: string }) => void
        }
    }
}

const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
const PATH_PREFIX = '/tantara'
const COUNTER_SCRIPT_URL = 'https://gc.zgo.at/count.js'

let scriptLoading: Promise<void> | null = null

const loadScript = (site: string): Promise<void> => {
    if (scriptLoading) {
        return scriptLoading
    }
    scriptLoading = new Promise(resolve => {
        window.goatcounter = { no_onload: true }
        const script = document.createElement('script')
        script.async = true
        script.src = COUNTER_SCRIPT_URL
        script.dataset.goatcounter = `https://${site}.goatcounter.com/count`
        script.onload = () => resolve()
        script.onerror = () => resolve()
        document.head.appendChild(script)
    })
    return scriptLoading
}

export default defineNuxtPlugin(nuxtApp => {
    const site = useRuntimeConfig().public.goatcounterSite
    if (!site) {
        return
    }
    const router = useRouter()
    const trackPath = (path: string): void => {
        void loadScript(site).then(() => window.goatcounter?.count?.({ path: PATH_PREFIX + path.replace(UUID_PATTERN, ':id') }))
    }
    nuxtApp.hook('app:mounted', () => trackPath(router.currentRoute.value.path))
    router.afterEach((to, from) => {
        if (to.path !== from.path) {
            trackPath(to.path)
        }
    })
})
