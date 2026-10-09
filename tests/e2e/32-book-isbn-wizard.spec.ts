import { expect, test } from '@playwright/test'
import { addLine, chooseProfile, finishPages, login, PARENT_NAME, toPages } from './helpers'

const ISBN = '9782070612758'

test.describe('book creation with a barcode', () => {
    test('the isbn lookup fills the title and the book keeps the isbn and the cover', async ({ page }) => {
        await page.route('**/api/books/isbn/*', route =>
            route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ isbn: ISBN, title: 'Le Petit Prince', author: 'Antoine de Saint-Exupéry', subjects: [], coverUrl: 'https://covers.openlibrary.org/b/id/2137711-M.jpg' }),
            }),
        )
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.goto('/books/new')
        await expect(page.getByRole('heading', { name: 'Le livre' })).toBeVisible()
        await page.getByTestId('isbn-lookup-open').click()
        await page.getByTestId('isbn-input').fill(ISBN)
        await page.getByTestId('isbn-search').click()
        await expect(page.getByTestId('isbn-filled')).toBeVisible()
        await expect(page.getByLabel('Titre du livre')).toHaveValue('Le Petit Prince')
        await toPages(page)
        await addLine(page, 1, null, 'On ne voit bien qu’avec le cœur.')
        await finishPages(page)
        const created = page.waitForRequest(request => request.url().endsWith('/api/books') && request.method() === 'POST')
        await page.getByRole('button', { name: 'Passer au studio' }).click()
        const body = (await created).postDataJSON() as { isbn?: string; coverUrl?: string; title: string }
        expect(body.title).toBe('Le Petit Prince')
        expect(body.isbn).toBe(ISBN)
        expect(body.coverUrl).toContain('covers.openlibrary.org')
    })

    test('a page can be marked without a voice', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.goto('/books/new')
        await page.getByLabel('Titre du livre').fill('Livre avec page muette')
        await toPages(page)
        await page.getByTestId('add-silent-page').click()
        await expect(page.getByText('Page vide').first()).toBeVisible()
    })
})
