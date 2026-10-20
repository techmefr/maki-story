import { fileURLToPath } from 'node:url'
import { defineOSDDNuxtConfig } from 'nuxt-osdd'

export default defineOSDDNuxtConfig({
    osdd: {
        technical: ['Atom', 'Molecule', 'Audio', 'Sound', 'Storage', 'Native', 'Motion', 'Locale', 'Theme', 'Auth', 'Mail', 'Upload', 'Media', 'DevFeedback'],
        functional: ['Account', 'Family', 'Profile', 'Invitation', 'Book', 'Recording', 'Review', 'Message', 'Vault', 'Tag', 'Lock', 'Reading', 'Notification', 'Help', 'Tour'],
    },
    compatibilityDate: '2025-07-15',
    devtools: { enabled: false },
    ssr: false,
    css: ['~/assets/css/main.css', '~/assets/css/child-world.css'],
    routeRules: {
        '/sw.js': { headers: { 'cache-control': 'no-cache' } },
    },
    nitro: {
        noExternals: true,
        experimental: { tasks: true },
        scheduledTasks: { '0 3 * * *': ['messages:purge', 'trash:purge', 'auth:purge'], '0 7 * * *': ['birthdays:remind', 'notifications:digest'] },
        inlineDynamicImports: true,
        serverAssets: [{ baseName: 'migrations', dir: fileURLToPath(new URL('./server/migrations', import.meta.url)) }],
    },
    runtimeConfig: {
        public: {
            apiBase: '',
            demoMode: process.env.NODE_ENV !== 'production' && process.env.DEMO_MODE === 'true',
            supportEmail: '',
            goatcounterSite: process.env.NODE_ENV === 'production' ? 'techmefr' : '',
            appVersion: process.env.npm_package_version ?? '',
            biometricTestBridge: false,
            sleepMinuteMs: 60000,
            sleepFadeMs: 8000,
            accessPollMs: 15000,
            aiCreationEnabled: false,
            appEnv: '',
        },
    },
    app: {
        pageTransition: { name: 'page', mode: 'out-in' },
        head: {
            title: 'Maki Story',
            htmlAttrs: { lang: 'fr' },
            meta: [
                { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
                { name: 'theme-color', content: '#FFF3DC' },
                { name: 'apple-mobile-web-app-capable', content: 'yes' },
                { name: 'mobile-web-app-capable', content: 'yes' },
                { name: 'apple-mobile-web-app-title', content: 'Maki Story' },
            ],
            script: [
                {
                    innerHTML:
                        "try{var c=localStorage.getItem('tantara-theme')||'auto';var d=c==='dark'||(c==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=d?'dark':'light'}catch(e){}",
                    tagPosition: 'head',
                },
            ],
            link: [
                { rel: 'manifest', href: '/manifest.webmanifest' },
                { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
                { rel: 'icon', type: 'image/png', href: '/favicon-32.png', sizes: '32x32' },
                { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
                { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/fredoka-700.woff2', crossorigin: '' },
            ],
        },
    },
})
