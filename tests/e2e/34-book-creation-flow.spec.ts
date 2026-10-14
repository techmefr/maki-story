import { expect, test } from '@playwright/test'
import { chooseProfile, login, PARENT_NAME, pngFile } from './helpers'

const openCover = async (page: import('@playwright/test').Page, title: string): Promise<void> => {
    await page.goto('/books/new')
    await expect(page.getByRole('heading', { name: 'Le livre' })).toBeVisible()
    const discard = page.getByTestId('discard-draft')
    if (await discard.isVisible({ timeout: 1500 }).catch(() => false)) {
        await discard.click()
    }
    await page.getByLabel('Titre du livre').fill(title)
}

test.describe('book creation by steps', () => {
    test('a book with a voice goes through cover, page and send', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await openCover(page, `Parcours ${info.project.name}`)
        await page.getByTestId('book-next').click()
        await expect(page.getByTestId('page-step')).toBeVisible()
        await expect(page.getByRole('heading', { name: 'Page 1' })).toBeVisible()
        await page.getByTestId('voice-1').getByLabel('Texte', { exact: true }).fill('Il pleut sur le lac.')
        await page.getByTestId('pages-finish').click()
        await expect(page.getByTestId('send-step')).toBeVisible()
        await expect(page.getByTestId('send-character-Narrateur')).toBeVisible()
        await page.getByTestId('book-save').click()
        await expect(page.getByTestId('send-done')).toBeVisible()
        await expect(page.getByTestId('send-studio')).toBeVisible()
    })

    test('a silent page and a blank credits page make a silent book that is valid', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await openCover(page, `Muet ${info.project.name}`)
        await page.getByTestId('book-next').click()
        await page.getByTestId('page-silent-1').click()
        await expect(page.getByText('Page muette', { exact: false })).toBeVisible()
        await page.getByTestId('pages-finish').click()
        await expect(page.getByTestId('send-silent')).toBeVisible()
        await page.getByTestId('book-save').click()
        await expect(page.getByTestId('send-done')).toContainText('muet')
    })

    test('a voice assigned later is flagged to assign in the review', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await openCover(page, `Plus tard ${info.project.name}`)
        await page.getByTestId('book-next').click()
        await page.getByTestId('voice-1').getByLabel('Texte', { exact: true }).fill('Bonjour.')
        await page.getByTestId('reader-later').click()
        await page.getByTestId('pages-finish').click()
        await expect(page.getByTestId('send-later')).toBeVisible()
        await expect(page.getByTestId('send-character-Narrateur')).toContainText('À attribuer')
    })

    test('the draft is kept on the server and can be resumed', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await openCover(page, `Brouillon serveur ${info.project.name}`)
        await page.getByTestId('save-draft').click()
        await expect.poll(async () => (await page.request.get('/api/book-draft')).status()).toBe(200)
        const draft = (await (await page.request.get('/api/book-draft')).json()) as { payload: { title: string } } | null
        expect(draft?.payload.title).toContain('Brouillon serveur')
        await page.evaluate(() => localStorage.clear())
        await page.goto('/books/new')
        await page.getByTestId('resume-draft').click()
        await expect(page.getByLabel('Titre du livre')).toHaveValue(new RegExp('Brouillon serveur'))
    })

    test('a page can be blank with a voice, or have a photo through the image sheet', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await openCover(page, `Image ${info.project.name}`)
        await page.getByTestId('book-next').click()
        await page.getByTestId('page-photo').click()
        await page.getByTestId('page-add-image').click()
        await page.getByTestId('image-input-gallery').setInputFiles(pngFile('page.png'))
        await expect(page.getByText('Photo ajoutée')).toBeVisible()
        await page.getByTestId('voice-1').getByLabel('Texte', { exact: true }).fill('Texte sur la photo.')
        await page.getByTestId('pages-finish').click()
        await page.getByTestId('book-save').click()
        await expect(page.getByTestId('send-done')).toBeVisible()
    })
})
