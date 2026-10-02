import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
    compatibilityDate: '2025-07-15',
    devtools: { enabled: false },
    ssr: false,
    css: ['~/assets/css/main.css'],
    routeRules: {
        '/sw.js': { headers: { 'cache-control': 'no-cache' } },
    },
    nitro: {
        noExternals: true,
        experimental: { tasks: true },
        scheduledTasks: { '0 3 * * *': ['messages:purge'], '0 7 * * *': ['birthdays:remind'] },
        inlineDynamicImports: true,
        serverAssets: [{ baseName: 'migrations', dir: fileURLToPath(new URL('./server/migrations', import.meta.url)) }],
    },
    runtimeConfig: {
        public: {
            apiBase: '',
            biometricTestBridge: false,
            sleepMinuteMs: 60000,
            sleepFadeMs: 8000,
            accessPollMs: 15000,
        },
    },
    app: {
        pageTransition: { name: 'page', mode: 'out-in' },
        head: {
            title: 'Tantara',
            htmlAttrs: { lang: 'fr' },
            meta: [
                { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
                { name: 'theme-color', content: '#FFF4D9' },
                { name: 'apple-mobile-web-app-capable', content: 'yes' },
                { name: 'mobile-web-app-capable', content: 'yes' },
                { name: 'apple-mobile-web-app-title', content: 'Tantara' },
            ],
            link: [
                { rel: 'manifest', href: '/manifest.webmanifest' },
                { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
                { rel: 'icon', type: 'image/png', href: '/favicon-32.png', sizes: '32x32' },
                { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
                { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
                { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
                {
                    rel: 'stylesheet',
                    href: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:ital,wght@0,500;0,700;0,800;1,500&display=swap',
                },
            ],
        },
    },
})
