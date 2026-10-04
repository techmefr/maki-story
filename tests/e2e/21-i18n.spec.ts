import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { chooseProfile, PARENT_NAME, signIn, uniqueAccount } from './helpers'

const chooseLanguage = async (page: Page, code: string): Promise<void> => {
    const header = page.getByRole('dialog').locator('.msec__head').nth(1)
    if ((await header.getAttribute('aria-expanded')) !== 'true') {
        await header.click()
    }
    await page.getByRole('dialog').locator(`button[lang="${code}"]`).last().click()
}

test.describe('interface language', () => {
    test('switches language, direction and draft notice from the profile menu', async ({ page }) => {
        await signIn(page.request, uniqueAccount('i18n'))
        await chooseProfile(page, PARENT_NAME)
        const html = page.locator('html')
        await expect(html).toHaveAttribute('lang', 'fr')
        await expect(html).toHaveAttribute('dir', 'ltr')

        await page.getByRole('button', { name: 'Réglages' }).click()
        await expect(page.getByRole('button', { name: 'Changer ma photo' })).toBeVisible()

        await chooseLanguage(page, 'en')
        await expect(html).toHaveAttribute('lang', 'en')
        await expect(page.getByRole('button', { name: 'Change my photo' })).toBeVisible()
        await expect(page.locator('.menu__draft')).toHaveCount(0)

        await chooseLanguage(page, 'ar')
        await expect(html).toHaveAttribute('lang', 'ar')
        await expect(html).toHaveAttribute('dir', 'rtl')
        await expect(page.getByRole('button', { name: 'تغيير صورتي' })).toBeVisible()
        expect(await page.evaluate(() => getComputedStyle(document.body).direction)).toBe('rtl')

        await chooseLanguage(page, 'mg')
        await expect(html).toHaveAttribute('lang', 'mg')
        await expect(html).toHaveAttribute('dir', 'ltr')
        await expect(page.locator('.menu__draft')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Hanova ny sarako' })).toBeVisible()

        await page.reload()
        await expect(html).toHaveAttribute('lang', 'mg')
    })

    test('picks the browser language when nothing is saved', async ({ browser }) => {
        const context = await browser.newContext({ locale: 'es-ES' })
        const page = await context.newPage()
        await page.goto('/login')
        await expect(page.locator('html')).toHaveAttribute('lang', 'es')
        await context.close()
        const unknown = await browser.newContext({ locale: 'ja-JP' })
        const fallback = await unknown.newPage()
        await fallback.goto('/login')
        await expect(fallback.locator('html')).toHaveAttribute('lang', 'fr')
        await unknown.close()
    })
})
