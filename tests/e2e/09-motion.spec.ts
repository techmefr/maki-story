import { expect, test } from '@playwright/test'
import { chooseProfile, login, PARENT_NAME } from './helpers'

test.describe('motion', () => {
    test.use({ contextOptions: { reducedMotion: 'no-preference' } })

    test('page curtain and transitions never block navigation', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const nav = page.viewportSize()!.width >= 720 ? page.locator('.nav .nav__item') : page.locator('.tabbar__item')
        for (const label of ['Messages', 'Famille', 'Bibliothèque', 'Famille']) {
            await nav.filter({ hasText: label }).click()
            await expect(page.locator('.curtain')).toHaveCSS('visibility', 'hidden', { timeout: 5000 })
        }
        await expect(page.getByRole('heading', { name: 'Ma famille' })).toBeVisible()
    })

    test('navigation icons are drawn', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const icons = page.viewportSize()!.width >= 720 ? page.locator('.nav svg.icon') : page.locator('.tabbar svg.icon')
        await expect(icons).toHaveCount(3)
    })

    test('list cards animate in without hiding content', async ({ page }) => {
        await login(page)
        await page.goto('/profiles')
        const cards = page.locator('button.card.pop-in')
        await expect(cards.first()).toBeVisible()
        await expect(cards.first()).toHaveCSS('opacity', '1')
    })
})
