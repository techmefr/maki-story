import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { addMember, chooseProfile, PARENT_NAME, signIn, uniqueAccount } from './helpers'

const requestedCues = (page: Page): Promise<string[]> => page.evaluate(() => (window as unknown as { __soundCues?: string[] }).__soundCues ?? [])

const openMenu = async (page: Page): Promise<void> => {
    await page.getByRole('button', { name: 'Mon profil' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
}

test.describe('sound cues', () => {
    test('are off by default for a parent and can be enabled and persisted', async ({ page }) => {
        await signIn(page.request, uniqueAccount('cues-parent'))
        await chooseProfile(page, PARENT_NAME)
        await openMenu(page)
        const toggle = page.getByRole('switch', { name: 'Activer les sons' })
        await expect(toggle).not.toBeChecked()
        await page.getByRole('button', { name: 'Fermer' }).click()
        expect(await requestedCues(page)).toEqual([])
        await openMenu(page)
        await toggle.check()
        await page.getByRole('button', { name: 'Fermer' }).click()
        await expect.poll(() => requestedCues(page)).toContain('button')
        await page.reload()
        await openMenu(page)
        await expect(page.getByRole('switch', { name: 'Activer les sons' })).toBeChecked()
    })

    test('are on by default for a child and tell button from navigation', async ({ page }) => {
        await signIn(page.request, uniqueAccount('cues-child'))
        await chooseProfile(page, PARENT_NAME)
        await addMember(page, 'Lova', 'Enfant')
        await chooseProfile(page, 'Lova')
        await openMenu(page)
        await expect(page.getByRole('switch', { name: 'Activer les sons' })).toBeChecked()
        await page.getByRole('button', { name: 'Fermer' }).click()
        const cues = await requestedCues(page)
        expect(cues).toContain('button')
    })
})
