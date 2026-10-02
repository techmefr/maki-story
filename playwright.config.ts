import { defineConfig, devices } from '@playwright/test'

process.env.E2E_RUN_ID ??= String(Date.now())

const PORT = Number(process.env.E2E_PORT ?? 3200)
const REMOTE_URL = process.env.E2E_BASE_URL
const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgresql://tantara@localhost:5544/tantara_e2e'

const fakeMicArgs = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']

const VIEWPORTS: { name: string; width: number; height: number }[] = [
    { name: 'w320-portrait', width: 320, height: 640 },
    { name: 'w320-landscape', width: 640, height: 320 },
    { name: 'w390-portrait', width: 390, height: 844 },
    { name: 'w390-landscape', width: 844, height: 390 },
    { name: 'w1180-portrait', width: 1180, height: 1640 },
    { name: 'w1180-landscape', width: 1180, height: 820 },
    { name: 'w1600-portrait', width: 1600, height: 2200 },
    { name: 'w1600-landscape', width: 1600, height: 900 },
]

const FLAG_OFF_PORT = PORT + 1

const serverFor = (port: number, isAiCreationEnabled: boolean) => ({
    command: `pnpm dev --port ${port}`,
    url: `http://localhost:${port}/api/auth/me`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
        DATABASE_URL: E2E_DATABASE_URL,
        SESSION_SECRET: 'e2e-secret',
        NUXT_IGNORE_LOCK: '1',
        AI_PROVIDER: 'fake',
        NOTIFY_PROVIDER: 'fake',
        AI_MONTHLY_BUDGET_USD: '0.12',
        OIDC_FAKE: '1',
        REGISTER_IP_LIMIT: '1000',
        OAUTH_IP_LIMIT: '1000',
        GOOGLE_CLIENT_ID: 'fake-google-client',
        APPLE_CLIENT_ID: 'fake-apple-client',
        NUXT_PUBLIC_BIOMETRIC_TEST_BRIDGE: '1',
        NUXT_PUBLIC_SLEEP_MINUTE_MS: '100',
        NUXT_PUBLIC_SLEEP_FADE_MS: '300',
        NUXT_PUBLIC_ACCESS_POLL_MS: '1000',
        NUXT_PUBLIC_AI_CREATION_ENABLED: String(isAiCreationEnabled),
    },
})

export default defineConfig({
    testDir: './tests/e2e',
    timeout: 90_000,
    expect: { timeout: 10_000 },
    fullyParallel: false,
    workers: 1,
    retries: 0,
    reporter: [['list']],
    globalSetup: REMOTE_URL ? undefined : './tests/e2e/global-setup.ts',
    globalTeardown: './tests/e2e/global-teardown.ts',
    use: {
        locale: 'fr-FR',
        baseURL: REMOTE_URL ?? `http://localhost:${PORT}`,
        permissions: ['microphone'],
        contextOptions: { reducedMotion: 'reduce' },
        launchOptions: { args: fakeMicArgs },
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'mobile', grepInvert: /@viewport/, use: { ...devices['Pixel 7'], launchOptions: { args: fakeMicArgs } } },
        { name: 'desktop', grepInvert: /@viewport/, use: { viewport: { width: 1280, height: 800 } } },
        ...VIEWPORTS.map(viewport => ({
            name: viewport.name,
            grep: /@viewport/,
            use: { viewport: { width: viewport.width, height: viewport.height }, isMobile: viewport.width < 720, hasTouch: viewport.width < 720 },
        })),
    ],
    webServer: REMOTE_URL ? undefined : [serverFor(PORT, true), serverFor(FLAG_OFF_PORT, false)],
})
