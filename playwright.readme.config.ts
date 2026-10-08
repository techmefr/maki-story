import { defineConfig } from '@playwright/test'
import base from './playwright.config'

const servers = Array.isArray(base.webServer) ? base.webServer : base.webServer ? [base.webServer] : []

export default defineConfig({
    ...base,
    testDir: './scripts',
    testMatch: 'readme-screenshots.ts',
    timeout: 600_000,
    projects: [{ name: 'readme' }],
    webServer: servers[0],
})
