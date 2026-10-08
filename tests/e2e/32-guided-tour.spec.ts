import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { ITourState } from '../../shared/types/tour'
import { addMemberApi } from './family-helpers'
import { chooseProfile, enterPin, PARENT_NAME, PROFILE_PIN, signIn, uniqueAccount, useProfile } from './helpers'

const popover = (page: Page) => page.locator('#driver-popover-content')

const tourState = async (page: Page): Promise<ITourState> => {
    const response = await page.request.get('/api/tour')
    expect(response.ok()).toBeTruthy()
    return (await response.json()) as ITourState
}

const putTour = (page: Page, status: string) => page.request.put('/api/tour', { data: { status } })

const openAsParent = async (page: Page, label: string): Promise<void> => {
    await signIn(page.request, uniqueAccount(label))
    await useProfile(page.request, PARENT_NAME)
}

const finishWelcome = async (page: Page, label: string): Promise<void> => {
    const account = uniqueAccount(label)
    await page.goto('/register')
    await page.getByLabel('E-mail').fill(account.email)
    await page.getByLabel('Mot de passe').fill(account.password)
    await page.getByLabel('Nom de la famille').fill(account.familyName)
    await page.getByLabel('Votre prénom').fill(PARENT_NAME)
    await page.getByRole('button', { name: 'Créer mon compte' }).click()
    await expect(page).toHaveURL(/\/welcome/)
    await enterPin(page, PROFILE_PIN)
    await enterPin(page, PROFILE_PIN)
    await page.getByTestId('welcome-children-skip').click()
    await page.getByTestId('welcome-invite-next').click()
    await page.getByTestId('welcome-finish').click()
    await expect(page).toHaveURL(/\/home/)
}

test.describe('guided tour', () => {
    test('starts once after the first launch, can be skipped and does not come back', async ({ page }) => {
        await finishWelcome(page, 'tour-first')
        await expect(popover(page)).toBeVisible()
        await expect(popover(page)).toContainText('Ton profil')
        await expect(popover(page)).toContainText('Étape 1 sur 13')
        await expect(popover(page).locator(':focus')).toHaveCount(1)
        await page.getByTestId('tour-skip').click()
        await expect(popover(page)).toHaveCount(0)
        await expect.poll(async () => (await tourState(page)).status).toBe('done')
        await page.reload()
        await expect(page.getByTestId('home-card-library')).toBeVisible()
        await expect(popover(page)).toHaveCount(0)
    })

    test('walks every parent step across the screens and records completion on the server', async ({ page }) => {
        await openAsParent(page, 'tour-walk')
        expect((await putTour(page, 'pending')).ok()).toBeTruthy()
        await chooseProfile(page, PARENT_NAME)
        await expect(popover(page)).toContainText('Ton profil')
        const titles: string[] = []
        for (let step = 0; step < 13; step++) {
            await expect(popover(page).locator('.driver-popover-title')).not.toHaveText(titles.at(-1) ?? '')
            titles.push((await popover(page).locator('.driver-popover-title').textContent()) ?? '')
            if (step < 12) {
                await popover(page).getByRole('button', { name: 'Suivant' }).click()
            }
        }
        expect(new Set(titles).size).toBe(13)
        await expect(popover(page)).toContainText('Revoir la visite')
        await popover(page).getByRole('button', { name: 'Terminer' }).click()
        await expect(popover(page)).toHaveCount(0)
        await expect.poll(async () => (await tourState(page)).status).toBe('done')
    })

    test('closes with the keyboard and can be replayed from the settings sheet', async ({ page }) => {
        await openAsParent(page, 'tour-replay')
        expect((await putTour(page, 'done')).ok()).toBeTruthy()
        await chooseProfile(page, PARENT_NAME)
        await page.goto('/home')
        await expect(page.getByTestId('home-card-library')).toBeVisible()
        await expect(popover(page)).toHaveCount(0)
        await page.getByTestId('settings-open').click()
        await page.getByTestId('tour-replay').click()
        await expect(popover(page)).toBeVisible()
        await expect(popover(page)).toContainText('Ton profil')
        await expect(popover(page).getByRole('button', { name: 'Fermer la visite' })).toBeVisible()
        await expect(popover(page).locator(':focus')).toHaveCount(1)
        await page.keyboard.press('Escape')
        await expect(popover(page)).toHaveCount(0)
        expect((await tourState(page)).status).toBe('done')
    })

    test('gives a relative the relative tour', async ({ page }) => {
        await openAsParent(page, 'tour-relative')
        await addMemberApi(page.request, 'Mamie', 'relative')
        await addMemberApi(page.request, 'Lova', 'child')
        await useProfile(page.request, 'Mamie')
        expect((await putTour(page, 'pending')).ok()).toBeTruthy()
        expect((await tourState(page)).audience).toBe('relative')
        await chooseProfile(page, 'Mamie')
        await expect(popover(page)).toContainText('L’accueil avec les enfants')
        await expect(popover(page)).toContainText('Étape 1 sur 5')
        await popover(page).getByRole('button', { name: 'Suivant' }).click()
        await expect(popover(page)).toContainText('Envoyer un message')
        await page.getByTestId('tour-skip').click()
        await expect.poll(async () => (await tourState(page)).status).toBe('done')
    })

    test('never shows for a child and the server refuses it', async ({ page }) => {
        await openAsParent(page, 'tour-child')
        await addMemberApi(page.request, 'Lova', 'child')
        expect((await putTour(page, 'pending')).ok()).toBeTruthy()
        await useProfile(page.request, 'Lova')
        expect((await page.request.get('/api/tour')).status()).toBe(403)
        expect((await putTour(page, 'pending')).status()).toBe(403)
        expect((await putTour(page, 'done')).status()).toBe(403)
        await chooseProfile(page, 'Lova')
        await expect(page).toHaveURL(/\/kid/)
        await expect(page.locator('main')).toBeVisible()
        await page.waitForTimeout(1500)
        await expect(popover(page)).toHaveCount(0)
    })

    test('rejects an unknown status', async ({ page }) => {
        await openAsParent(page, 'tour-invalid')
        expect((await putTour(page, 'later')).status()).toBe(400)
        expect((await tourState(page)).status).toBe('none')
    })

    test('stays inside the viewport at the largest text size', async ({ page }) => {
        await page.addInitScript(() => window.localStorage.setItem('tantara-text-size', 'max'))
        await openAsParent(page, 'tour-max')
        expect((await putTour(page, 'pending')).ok()).toBeTruthy()
        await chooseProfile(page, PARENT_NAME)
        await expect(page.locator('html')).toHaveAttribute('data-text-size', 'max')
        await expect(popover(page)).toBeVisible()
        const viewport = page.viewportSize()!
        for (let step = 0; step < 4; step++) {
            await expect(popover(page).locator('.driver-popover-title')).toBeVisible()
            await page.waitForTimeout(300)
            const box = (await popover(page).boundingBox())!
            expect(box.x).toBeGreaterThanOrEqual(-1)
            expect(box.y).toBeGreaterThanOrEqual(-1)
            expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1)
            expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1)
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
            expect(overflow).toBeLessThanOrEqual(1)
            await popover(page).getByRole('button', { name: 'Suivant' }).click()
        }
    })
})
