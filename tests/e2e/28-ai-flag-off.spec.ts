import { expect, test } from '@playwright/test'
import { chooseProfile, PARENT_NAME, signIn, startBook, uniqueAccount } from './helpers'

test.skip(Boolean(process.env.E2E_BASE_URL), 'The flag off server is started locally')

const FLAG_OFF_PORT = Number(process.env.E2E_PORT ?? 3200) + 1

test.use({ baseURL: `http://localhost:${FLAG_OFF_PORT}` })

test.describe('AI creation flag off', () => {
    test('hides every entry point and answers 404 on the AI routes', async ({ page }) => {
        await signIn(page.request, uniqueAccount('ai-off'))
        await chooseProfile(page, PARENT_NAME)
        await expect(page.getByTestId('ai-create')).toHaveCount(0)

        await startBook(page, 'Sans IA')
        await expect(page.getByTestId('ai-prefill-input')).toHaveCount(0)

        await page.getByRole('button', { name: 'Mon profil' }).click()
        await expect(page.getByTestId('ai-quota')).toHaveCount(0)

        await page.goto('/books/ai')
        await expect(page).toHaveURL(/\/home/)

        expect((await page.request.get('/api/ai/status')).status()).toBe(404)
        expect((await page.request.post('/api/ai/book-generation', { data: {} })).status()).toBe(404)
        expect((await page.request.post('/api/ai/photo-prefill', { data: {} })).status()).toBe(404)
        expect((await page.request.post('/api/ai/translation', { data: {} })).status()).toBe(404)
        expect((await page.request.put('/api/ai/budget', { data: { monthlyBudgetUsd: 1 } })).status()).toBe(404)
        expect((await page.request.post('/api/books/abc/validate')).status()).toBe(404)
    })
})
