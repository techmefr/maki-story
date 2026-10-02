import { expect, test } from '@playwright/test'
import { chooseProfile, login, PARENT_NAME } from './helpers'

test.describe('feedback', () => {
    test('sends a mood and a comment then lists them', async ({ page }, info) => {
        const comment = `Super écran ${info.project.name}`
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.getByRole('button', { name: 'Réglages' }).click()
        await page.getByRole('button', { name: 'Donner mon avis' }).click()
        await expect(page.getByRole('button', { name: 'Envoyer' })).toBeDisabled()
        await page.getByRole('button', { name: 'J’adore' }).click()
        await page.getByPlaceholder(/Ce qui marche/).fill(comment)
        await page.getByRole('button', { name: 'Envoyer' }).click()
        await expect(page.getByText('Merci, c’est noté.')).toBeVisible()
        await page.goto('/feedback')
        await expect(page.getByText(comment)).toBeVisible()
        await expect(page.getByText('J’adore').first()).toBeVisible()
    })

    test('rejects an empty feedback through the api', async ({ page }) => {
        await login(page)
        const response = await page.request.post('/api/feedback', { data: { memberName: 'x', screen: '/', mood: null, text: '  ' } })
        expect(response.status()).toBe(400)
    })
})
