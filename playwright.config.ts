import { defineConfig, devices } from '@playwright/test'

process.env.E2E_RUN_ID ??= String(Date.now())

const PORT = Number(process.env.E2E_PORT ?? 3200)
const REMOTE_URL = process.env.E2E_BASE_URL
const E2E_DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgresql://tantara@localhost:5544/tantara_e2e'

const fakeMicArgs = ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']

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
        baseURL: REMOTE_URL ?? `http://localhost:${PORT}`,
        permissions: ['microphone'],
        contextOptions: { reducedMotion: 'reduce' },
        launchOptions: { args: fakeMicArgs },
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    projects: [
        { name: 'mobile', use: { ...devices['Pixel 7'], launchOptions: { args: fakeMicArgs } } },
        { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    ],
    webServer: REMOTE_URL
        ? undefined
        : {
              command: `pnpm dev --port ${PORT}`,
              url: `http://localhost:${PORT}/api/auth/me`,
              reuseExistingServer: false,
              timeout: 120_000,
              env: {
                  DATABASE_URL: E2E_DATABASE_URL,
                  SESSION_SECRET: 'e2e-secret',
                  NUXT_IGNORE_LOCK: '1',
                  AI_PROVIDER: 'fake',
                  AI_MONTHLY_BUDGET_USD: '0.12',
                  OIDC_FAKE: '1',
                  GOOGLE_CLIENT_ID: 'fake-google-client',
                  APPLE_CLIENT_ID: 'fake-apple-client',
                  NUXT_PUBLIC_BIOMETRIC_TEST_BRIDGE: '1',
                  NUXT_PUBLIC_SLEEP_MINUTE_MS: '100',
                  NUXT_PUBLIC_SLEEP_FADE_MS: '300',
              },
          },
})
