import { expect, test } from '@playwright/test'
import { chooseProfile, login, PARENT_NAME } from './helpers'

test('adult home opens the real book creation and library from its welcome card', async ({ page }) => {
    await login(page)
    await chooseProfile(page, PARENT_NAME)
    await page.goto('/home')
    const welcome = page.getByTestId('adult-home-welcome')
    await expect(welcome).toBeVisible()
    await expect(page.locator('.shell--adult')).toBeVisible()
    await welcome.getByRole('link', { name: 'Nouveau livre', exact: true }).click()
    await expect(page).toHaveURL(/\/books\/new$/)
    await page.goto('/home')
    await welcome.getByRole('link', { name: 'Bibliothèque', exact: true }).click()
    await expect(page).toHaveURL(/\/library$/)
})

test('adult primary screens fit the viewport and desktop navigation has readable labels', async ({ page }) => {
    await login(page)
    await chooseProfile(page, PARENT_NAME)
    for (const path of ['/home', '/library', '/family', '/books/new', '/vault']) {
        await page.goto(path)
        await expect(page.locator('.shell--adult')).toBeVisible()
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow, path).toBeLessThanOrEqual(1)
    }
    if ((page.viewportSize()?.width ?? 0) >= 1024) {
        await expect(page.locator('.rail')).toBeVisible()
        const width = await page.locator('.rail').evaluate(element => element.getBoundingClientRect().width)
        expect(width).toBe(224)
    }
})
