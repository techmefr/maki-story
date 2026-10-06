import { expect, test } from '@playwright/test'
import { chooseProfile, createReadyBook, login, PARENT_NAME, uniqueName } from './helpers'

test.describe('motion', () => {
    test.use({ contextOptions: { reducedMotion: 'no-preference' } })

    test('page curtain and transitions never block navigation', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const nav = page.viewportSize()!.width >= 1024 ? page.locator('.rail .rail__item') : page.locator('.tabbar__item')
        for (const label of ['Accueil', 'Famille', 'Bibliothèque', 'Famille']) {
            await nav.filter({ hasText: label }).click()
            await expect(page.locator('.curtain')).toHaveCSS('visibility', 'hidden', { timeout: 5000 })
        }
        await expect(page.getByRole('heading', { name: 'Ma famille' })).toBeVisible()
    })

    test('navigation icons are drawn', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const icons = page.viewportSize()!.width >= 1024 ? page.locator('.rail svg.icon') : page.locator('.tabbar svg.icon')
        await expect(icons).toHaveCount(3)
    })

    test('list cards animate in without hiding content', async ({ page }) => {
        await login(page)
        await page.goto('/profiles')
        const cards = page.locator('button.card.pop-in')
        await expect(cards.first()).toBeVisible()
        await expect(cards.first()).toHaveCSS('opacity', '1')
    })

    test('reader entry and exit use the book transitions and the blob follows playback', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const lines = [0, 1, 2, 3, 4, 5].map(index => ({ pageIndex: 0, character: '', text: `Ligne ${index}`, memberName: PARENT_NAME }))
        const title = uniqueName('Blob', info.project.name)
        await createReadyBook(page, title, 'solo', lines)
        await page.goto('/library')
        const curtain = page.locator('.curtain')
        await page.getByRole('link', { name: new RegExp(title) }).click()
        await expect(curtain).toHaveClass(/curtain--book-open/)
        await expect(page.getByRole('button', { name: 'Lecture' })).toBeVisible()
        await expect(page.locator('.blob--active')).toHaveCount(0)
        await page.getByRole('button', { name: 'Lecture' }).click()
        await expect(page.locator('.blob--active')).toHaveCount(1)
        await expect(page.getByRole('button', { name: 'Pause' })).toHaveCount(0)
        await page.getByRole('link', { name: 'Retour' }).click()
        await expect(curtain).toHaveClass(/curtain--book-close/)
    })

    test.describe('reduced motion', () => {
        test.use({ contextOptions: { reducedMotion: 'reduce' } })

        test('curtain is disabled', async ({ page }) => {
            await login(page)
            await page.goto('/profiles')
            await expect(page.locator('.curtain')).toHaveCSS('display', 'none')
        })
    })
})
