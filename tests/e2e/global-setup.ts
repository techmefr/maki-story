import { chromium } from '@playwright/test'
import type { FullConfig } from '@playwright/test'
import postgres from 'postgres'

const WARM_PATHS = ['/login', '/register']
const WARM_TIMEOUT_MS = 120_000

const warmDevServer = async (baseUrl: string): Promise<void> => {
    const browser = await chromium.launch()
    try {
        const page = await browser.newPage()
        for (const path of WARM_PATHS) {
            await page.goto(`${baseUrl}${path}`, { timeout: WARM_TIMEOUT_MS })
            await page.getByRole('button').first().waitFor({ timeout: WARM_TIMEOUT_MS })
        }
    } finally {
        await browser.close()
    }
}

export default async function globalSetup(config: FullConfig): Promise<void> {
    const url = process.env.E2E_DATABASE_URL ?? 'postgresql://tantara@localhost:5544/tantara_e2e'
    const db = postgres(url, { max: 1, onnotice: () => undefined })
    try {
        await db.unsafe("drop schema public cascade")
        await db.unsafe("create schema public")
    } finally {
        await db.end()
    }
    await warmDevServer(String(config.projects[0]!.use.baseURL))
}
