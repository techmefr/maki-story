import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { addMember, chooseProfile, createReadyBook, login, PARENT_NAME, switchProfile, uniqueName } from './helpers'

const MAX_SIZE_PX = 40

const expectNoHorizontalOverflow = async (page: Page, where: string): Promise<void> => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    const wide = overflow > 1 ? await page.evaluate(() => { const w = document.documentElement.clientWidth; return Array.from(document.querySelectorAll('body *')).filter(e => e.getBoundingClientRect().right > w + 1).slice(0, 6).map(e => e.tagName + '.' + e.className + ' ' + Math.round(e.getBoundingClientRect().right) + '/' + w).join(' | ') }) : ''
    expect(overflow, `horizontal overflow on ${where} ${wide}`).toBeLessThanOrEqual(1)
}

const useMaxTextSize = async (page: Page): Promise<void> => {
    await page.addInitScript(() => localStorage.setItem('tantara-text-size', 'max'))
}

test.describe('accessibility', () => {
    test('signed-out pages keep the layout at the largest text size', async ({ page }) => {
        await useMaxTextSize(page)
        for (const path of ['/login', '/register']) {
            await page.goto(path)
            await expect(page.getByRole('heading').first()).toBeVisible()
            await expect(page.locator('html')).toHaveCSS('font-size', `${MAX_SIZE_PX}px`)
            await expectNoHorizontalOverflow(page, path)
        }
    })

    test('exposes landmarks and a skip link', async ({ page }) => {
        await login(page)
        await expect(page.locator('main#main')).toHaveCount(1)
        await page.keyboard.press('Tab')
        await expect(page.getByRole('link', { name: 'Aller au contenu' })).toBeFocused()
    })

    test('keeps the profile menu usable from the keyboard', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const trigger = page.getByRole('button', { name: 'Réglages' })
        await trigger.click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        await expect(dialog.locator(':focus')).toHaveCount(1)
        await page.keyboard.press('Escape')
        await expect(dialog).toHaveCount(0)
        await expect(trigger).toBeFocused()
    })

    test('gives every touch target at least 44px on the parent library', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.goto('/library')
        await expect(page.getByRole('heading', { name: 'Bibliothèque' })).toBeVisible()
        const heights = await page.evaluate(() =>
            Array.from(document.querySelectorAll<HTMLElement>('.btn, .chip, .picker, .tabbar__item, .nav__item'))
                .filter(element => element.offsetParent !== null)
                .map(element => Math.round(element.getBoundingClientRect().height)),
        )
        expect(heights.length).toBeGreaterThan(0)
        expect(Math.min(...heights)).toBeGreaterThanOrEqual(44)
    })

    test('changes the text size from the profile menu and remembers it', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.getByRole('button', { name: 'Réglages' }).click()
        const group = page.getByRole('dialog').getByRole('group', { name: 'Taille du texte' })
        await expect(group.getByRole('button', { name: 'Normal' })).toHaveAttribute('aria-pressed', 'true')
        await group.getByRole('button', { name: 'Maximum' }).click()
        await expect(group.getByRole('button', { name: 'Maximum' })).toHaveAttribute('aria-pressed', 'true')
        await expect(page.locator('html')).toHaveCSS('font-size', `${MAX_SIZE_PX}px`)
        await expectNoHorizontalOverflow(page, 'profile menu')
        await page.reload()
        await expect(page.locator('html')).toHaveCSS('font-size', `${MAX_SIZE_PX}px`)
        await page.getByRole('button', { name: 'Réglages' }).click()
        await page.getByRole('dialog').getByRole('group', { name: 'Taille du texte' }).getByRole('button', { name: 'Normal' }).click()
        await expect(page.locator('html')).toHaveCSS('font-size', '16px')
    })

    test('keeps every main screen free of horizontal overflow at the largest text size', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const child = uniqueName('Kikiprenomtreslongpourtester', project)
        await addMember(page, child, 'Enfant')
        const bookTitle = `Texte géant ${project}`
        await createReadyBook(page, bookTitle, 'multi', [
            { pageIndex: 0, character: 'Narrateur', text: 'Un', memberName: PARENT_NAME },
            { pageIndex: 1, character: 'Petit', text: 'Deux', memberName: PARENT_NAME },
        ])
        await page.evaluate(() => localStorage.setItem('tantara-text-size', 'max'))
        for (const path of ['/home', '/messages', '/family', '/family/add', '/books/new', '/family/devices', '/storage', '/feedback']) {
            await page.goto(path)
            await expect(page.getByRole('heading').first()).toBeVisible()
            await expect(page.locator('html')).toHaveCSS('font-size', `${MAX_SIZE_PX}px`)
            await expectNoHorizontalOverflow(page, path)
        }
        await page.goto('/home')
        await page.getByRole('button', { name: 'Réglages' }).click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await expectNoHorizontalOverflow(page, 'profile menu')
        await page.goto('/library')
        await page.getByRole('button', { name: `Fiche de ${bookTitle}` }).first().click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await expectNoHorizontalOverflow(page, 'book sheet')
        await page.keyboard.press('Escape')
        await switchProfile(page, child)
        await expect(page).toHaveURL(/\/kid$/)
        for (const path of ['/kid', '/kid/library']) {
            await page.goto(path)
            await expect(page.getByRole('heading').first()).toBeVisible()
            await expectNoHorizontalOverflow(page, path)
        }
        await page.getByRole('link', { name: new RegExp(bookTitle) }).first().click()
        await expect(page).toHaveURL(/\/kid\/listen\//)
        await expect(page.getByRole('button', { name: 'Lire' })).toBeVisible()
        await expectNoHorizontalOverflow(page, 'listening screen')
        await expect(page.getByRole('button', { name: 'Lire' })).toBeInViewport()
    })
})
