import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { addVoice, apiJson, chooseProfile, fillVoice, finishPages, login, newVoice, nextPage, sendBook, toPages, voiceCard, pngFile, recordAndSend, uniqueName, PARENT_NAME } from './helpers'
import type { IBook } from '../../shared/types/book'

test.describe.configure({ mode: 'serial' })

const recordMemberLines = async (page: Page, member: string): Promise<void> => {
    await page.locator('.studio__voice', { hasText: member }).first().click()
    for (let i = 0; i < 5; i++) {
        const isStillTodo = await page.locator('.studio__voice', { hasText: new RegExp(`${member}.* (\\d+)/(\\d+)`) }).first().innerText()
        const [, done, total] = isStillTodo.match(/(\d+)\/(\d+)/) ?? []
        if (done === total) {
            return
        }
        await recordAndSend(page)
        await expect(page.locator('.studio__voice', { hasText: member }).first()).not.toHaveText(new RegExp(`${done}/${total}$`), { timeout: 15000 })
    }
}

test.describe('multi voice book', () => {
    let bookId = ''

    test('creates a book with photos, two pages, characters and cast voices', async ({ page }, info) => {
        const project = info.project.name
        const mamie = uniqueName('Mamie', project)
        const lova = uniqueName('Lova', project)
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.goto('/library')
        await page.getByRole('link', { name: 'Nouveau livre' }).click()
        await expect(page.getByRole('heading', { name: 'Le livre' })).toBeVisible()
        const discard = page.getByTestId('discard-draft')
        if (await discard.isVisible({ timeout: 1000 }).catch(() => false)) {
            await discard.click()
        }
        await page.getByLabel('Titre du livre').fill(`Le petit zébu ${project}`)
        await toPages(page)

        await page.getByTestId('page-photo').click()
        await page.getByTestId('page-add-image').click()
        await page.getByTestId('image-input-gallery').setInputFiles(pngFile('p1.png'))
        await expect(page.getByText('Photo ajoutée')).toBeVisible()
        await fillVoice(page, 1, 'Au bord du lac, le zébu regardait les oiseaux.')
        await addVoice(page)
        await newVoice(page, 2, 'Petit Zébu', lova)
        await fillVoice(page, 2, 'Pourquoi je n’ai pas d’ailes ?')
        await voiceCard(page, 2).getByLabel('Description', { exact: false }).fill('Chuchoté')

        await nextPage(page)
        await page.getByTestId('page-photo').click()
        await page.getByTestId('page-add-image').click()
        await page.getByTestId('image-input-gallery').setInputFiles(pngFile('p2.png'))
        await expect(page.getByText('Photo ajoutée')).toBeVisible()
        await newVoice(page, 1, 'Maman Zébu', mamie)
        await fillVoice(page, 1, 'Parce que tu as quatre pattes solides.')
        await addVoice(page)
        await voiceCard(page, 2).getByRole('button', { name: 'Narrateur', exact: true }).click()
        await fillVoice(page, 2, 'Et le lémurien bondit de branche en branche.')
        await finishPages(page)

        await expect(page.getByTestId('send-step')).toBeVisible()
        await expect(page.getByTestId('send-character-Petit Zébu')).toContainText(lova)
        bookId = await sendBook(page)

        const book = await apiJson<IBook>(page, `/books/${bookId}`)
        expect(book.lines).toHaveLength(4)
        expect(book.lines.every(line => line.memberId !== null)).toBeTruthy()
        expect(book.pages).toHaveLength(2)
        expect(book.characters.map(character => character.name)).toEqual(['Narrateur', 'Petit Zébu', 'Maman Zébu'])
        expect(book.characters[0]!.isNarrator).toBe(true)
        expect(book.lines.map(line => line.tone)).toContain('Chuchoté')
        expect(book.status).toBe('to_record')
    })

    test('shows the book as to record in the library', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.goto('/library')
        await expect(page.locator('.book', { hasText: `Le petit zébu ${info.project.name}` }).first()).toContainText('À enregistrer')
    })

    test('records every line in the studio and publishes', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.goto(`/books/${bookId}/studio`)
        await expect(page.getByText('Au bord du lac, le zébu regardait les oiseaux.').first()).toBeVisible()
        await expect(page.getByRole('button', { name: /Enregistre toutes les répliques/ })).toBeDisabled()
        await recordMemberLines(page, PARENT_NAME)
        await expect(page.getByRole('button', { name: 'Écouter' })).toBeEnabled()
        await page.getByRole('button', { name: 'Refaire' }).click()
        await expect(page.getByRole('button', { name: 'Écouter' })).toBeDisabled()
        await recordMemberLines(page, PARENT_NAME)
        await recordMemberLines(page, uniqueName('Lova', test.info().project.name))
        await recordMemberLines(page, uniqueName('Mamie', test.info().project.name))
        await expect(page.getByRole('button', { name: 'Publier le livre' })).toBeEnabled()
        await page.getByRole('button', { name: 'Publier le livre' }).click()
        await expect(page).toHaveURL(/\/play$/)
        const book = await apiJson<{ status: string; lines: { audioFileId: string | null; audioMs: number }[] }>(page, `/books/${bookId}`)
        expect(book.status).toBe('ready')
        expect(book.lines.every(line => line.audioFileId !== null && line.audioMs > 500)).toBeTruthy()
    })

    test('plays the book from the parent reader', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.goto(`/books/${bookId}/play`)
        await expect(page.getByRole('heading', { name: `Le petit zébu ${info.project.name}` })).toBeVisible()
        await expect(page.getByText('Pourquoi je n’ai pas d’ailes ?')).toBeVisible()
        await page.getByRole('button', { name: 'Lecture' }).click()
        await expect(page.getByRole('button', { name: 'Pause' })).toHaveCount(0)
        await page.getByRole('button', { name: 'Suivant' }).click()
        await page.getByRole('button', { name: 'Précédent' }).click()
        await page.getByRole('button', { name: /1×/ }).click()
        await expect(page.getByRole('button', { name: /1.25×/ })).toBeVisible()
        await page.locator('.card--tap', { hasText: 'Parce que tu as quatre pattes solides.' }).click()
        await expect(page.getByRole('button', { name: 'Pause' })).toHaveCount(0)
    })

    test('shows the published book as ready and deletes another one', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.goto('/library')
        await expect(page.locator('.book', { hasText: `Le petit zébu ${info.project.name}` }).first()).not.toContainText('À enregistrer')
        const response = await page.request.post('/api/books', {
            data: { title: 'A supprimer', kind: 'multi', soloMemberId: null, imageDesc: '', pageFileIds: [], lines: [{ pageIndex: 0, character: '', text: 'x' }] },
        })
        const created = (await response.json()) as { id: string }
        await page.goto(`/books/${created.id}/studio`)
        page.once('dialog', dialog => dialog.accept())
        await page.getByRole('button', { name: 'Supprimer ce livre' }).click()
        await expect(page).toHaveURL(/\/library/)
        const list = await apiJson<{ id: string }[]>(page, '/books')
        expect(list.some(book => book.id === created.id)).toBeFalsy()
    })
})
