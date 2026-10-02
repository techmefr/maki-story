import { expect, test } from '@playwright/test'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { chooseProfile, login, PARENT_NAME } from './helpers'

const APP_DIR = join(process.cwd(), 'app')
const FONT_DIR = join(process.cwd(), 'public', 'fonts')
const MAX_FONT_BYTES = 150 * 1024
const MIN_TARGET_PX = 48

const collectVue = (dir: string): string[] =>
    readdirSync(dir).flatMap(entry => {
        const path = join(dir, entry)
        if (statSync(path).isDirectory()) {
            return collectVue(path)
        }
        return path.endsWith('.vue') ? [path] : []
    })

test.describe('design system', () => {
    test('no native checkbox, range, select or raw btn class is left in the templates', () => {
        const offenders: string[] = []
        for (const file of collectVue(APP_DIR)) {
            const source = readFileSync(file, 'utf8')
            if (/type="(checkbox|range)"|<select[\s>]|class="btn[ "]/.test(source) && !file.endsWith('AppButton.vue')) {
                offenders.push(file)
            }
        }
        expect(offenders).toEqual([])
    })

    test('fonts are self-hosted, light, and never requested from a CDN', async ({ page }) => {
        const external: string[] = []
        page.on('request', request => {
            if (/fonts\.(googleapis|gstatic)\.com/.test(request.url())) {
                external.push(request.url())
            }
        })
        await page.goto('/login')
        await expect(page.getByRole('heading').first()).toBeVisible()
        const loaded = await page.evaluate(async () => {
            await document.fonts.ready
            return ['700 16px Fredoka', '700 16px Nunito'].map(font => document.fonts.check(font))
        })
        expect(loaded).toEqual([true, true])
        expect(external).toEqual([])
        const total = readdirSync(FONT_DIR)
            .filter(name => !name.startsWith('andika'))
            .reduce((sum, name) => sum + statSync(join(FONT_DIR, name)).size, 0)
        expect(total).toBeLessThan(MAX_FONT_BYTES)
    })

    test('signed-out pages have at most one primary button and 48px targets', async ({ page }) => {
        for (const path of ['/login', '/register']) {
            await page.goto(path)
            await expect(page.getByRole('heading').first()).toBeVisible()
            const primaries = await page.locator('.btn--primary:visible').count()
            expect(primaries, `primary buttons on ${path}`).toBeLessThanOrEqual(1)
            const heights = await page.evaluate(() =>
                Array.from(document.querySelectorAll<HTMLElement>('.btn:not(.btn--tertiary)'))
                    .filter(element => element.offsetParent !== null)
                    .map(element => Math.round(element.getBoundingClientRect().height)),
            )
            expect(Math.min(...heights)).toBeGreaterThanOrEqual(MIN_TARGET_PX)
        }
    })

    test('every touch target is at least 48px on the parent library', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.goto('/home')
        await expect(page.getByRole('heading', { name: 'Bibliothèque' })).toBeVisible()
        const heights = await page.evaluate(() =>
            Array.from(document.querySelectorAll<HTMLElement>('.btn:not(.btn--tertiary), .chip, .picker'))
                .filter(element => element.offsetParent !== null)
                .map(element => Math.round(element.getBoundingClientRect().height)),
        )
        expect(Math.min(...heights)).toBeGreaterThanOrEqual(MIN_TARGET_PX)
    })

    test('the empty state animation is static under reduced motion', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.goto('/storage')
        const maki = page.locator('.empty__maki').first()
        await expect(maki).toBeVisible()
        await expect(maki).toHaveCSS('animation-name', 'none')
    })
})
