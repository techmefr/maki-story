import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { chooseProfile, login, uniqueName } from './helpers'

const hasNoHorizontalScroll = async (page: Page): Promise<boolean> => {
    return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
}

test.describe('responsive layout', () => {
    test('uses the right navigation for the screen size', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, 'Parent')
        const isDesktop = info.project.name === 'desktop'
        await expect(page.locator('.tabbar')).toBeVisible({ visible: !isDesktop })
        await expect(page.locator('.nav')).toBeVisible({ visible: isDesktop })
        const links = isDesktop ? page.locator('.nav .nav__item') : page.locator('.tabbar__item')
        await links.filter({ hasText: 'Messages' }).click()
        await expect(page).toHaveURL(/\/messages/)
        await links.filter({ hasText: 'Famille' }).click()
        await expect(page).toHaveURL(/\/family/)
        await links.filter({ hasText: 'Bibliothèque' }).click()
        await expect(page).toHaveURL(/\/home/)
    })

    test('never scrolls horizontally on any screen', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, 'Parent')
        for (const path of ['/home', '/books/new', '/family', '/family/add', '/messages', '/feedback', '/profiles']) {
            await page.goto(path)
            await page.waitForLoadState('networkidle')
            expect(await hasNoHorizontalScroll(page), `horizontal scroll on ${path}`).toBeTruthy()
        }
        await chooseProfile(page, uniqueName('Lova', info.project.name))
        for (const path of ['/kid', '/kid/library']) {
            await page.goto(path)
            await page.waitForLoadState('networkidle')
            expect(await hasNoHorizontalScroll(page), `horizontal scroll on ${path}`).toBeTruthy()
        }
    })

    test('the login page fits the screen', async ({ page }) => {
        await page.goto('/login')
        await expect(page.getByRole('button', { name: 'Se connecter' })).toBeInViewport()
        expect(await hasNoHorizontalScroll(page)).toBeTruthy()
    })

    test('the profile switcher opens as a sheet and closes', async ({ page }) => {
        await login(page)
        await chooseProfile(page, 'Parent')
        await page.getByRole('button', { name: 'Changer de profil' }).click()
        await expect(page.locator('.sheet')).toBeVisible()
        await page.locator('.sheet-backdrop').click({ position: { x: 5, y: 5 } })
        await expect(page.locator('.sheet')).toHaveCount(0)
    })
})
