import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { addLine, apiJson, chooseProfile, linesCard, login, nextStep, pngFile, recordOnce, uniqueName, PARENT_NAME } from './helpers'
import type { IBook } from '../../shared/types/book'

test.describe.configure({ mode: 'serial' })

const recordMemberLines = async (page: Page, member: string): Promise<void> => {
    await page.locator('.picker', { hasText: member }).first().click()
    const rec = page.getByRole('button', { name: 'Enregistrer' })
    for (let i = 0; i < 5; i++) {
        const isStillTodo = await page.locator('.picker', { hasText: new RegExp(`${member}.* (\\d+)/(\\d+)`) }).first().innerText()
        const [, done, total] = isStillTodo.match(/(\d+)\/(\d+)/) ?? []
        if (done === total) {
            return
        }
        await recordOnce(page, rec)
        await expect(page.locator('.picker', { hasText: member }).first()).not.toHaveText(new RegExp(`${done}/${total}$`), { timeout: 15000 })
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
        await page.getByRole('link', { name: 'Nouveau livre' }).click()
        await expect(page.getByRole('heading', { name: 'Le livre' })).toBeVisible()
        await expect(page.getByText('1/5')).toBeVisible()
        await page.getByLabel('Titre du livre').fill(`Le petit zébu ${project}`)
        await nextStep(page)

        await expect(page.getByRole('heading', { name: 'Les pages' })).toBeVisible()
        await page.locator('input[type=file]').setInputFiles([pngFile('p1.png'), pngFile('p2.png')])
        await expect(page.locator('.thumb')).toHaveCount(2)
        await page.getByRole('button', { name: 'Retirer la page 2' }).click()
        await expect(page.locator('.thumb')).toHaveCount(1)
        await page.locator('input[type=file]').setInputFiles(pngFile('p2.png'))
        await expect(page.locator('.thumb')).toHaveCount(2)
        await page.getByRole('group', { name: 'Page 1' }).getByLabel('Décris l’image de la page (facultatif)').fill('Un zébu près du lac Itasy')
        await nextStep(page)

        await expect(page.getByRole('heading', { name: 'Les personnages' })).toBeVisible()
        await expect(page.getByRole('group', { name: 'Personnage Narrateur' })).toBeVisible()
        for (const name of ['Petit Zébu', 'Maman Zébu']) {
            await page.getByLabel('Nouveau personnage').fill(name)
            await page.getByRole('button', { name: 'Ajouter un personnage' }).click()
        }
        await expect(page.getByText('1/3 personnages ont une voix.')).toBeVisible()
        await page.getByRole('group', { name: 'Personnage Petit Zébu' }).locator('.picker', { hasText: lova }).click()
        const maman = page.getByRole('group', { name: 'Personnage Maman Zébu' })
        await maman.locator('.picker', { hasText: mamie }).click()
        await maman.getByLabel('Description (facultatif)').fill('Une maman zébu très douce')
        await expect(page.getByText('3/3 personnages ont une voix.')).toBeVisible()
        await nextStep(page)

        await expect(page.getByRole('heading', { name: 'Les répliques' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Suivant', exact: true })).toBeDisabled()
        await expect(page.getByPlaceholder(/Qui parle/)).toHaveCount(0)
        await addLine(page, 1, 'Narrateur', 'Au bord du lac, le zébu regardait les oiseaux.')
        await addLine(page, 1, 'Petit Zébu', 'Pourquoi je n’ai pas d’ailes ?')
        await addLine(page, 2, 'Maman Zébu', 'Parce que tu as quatre pattes solides.')
        await addLine(page, 2, 'Narrateur', 'Et le lémurien bondit de branche en branche.')
        await linesCard(page, 1).getByRole('button', { name: 'Retirer la réplique' }).last().click()
        await linesCard(page, 1).getByRole('button', { name: 'Chuchoté', exact: true }).click()
        await linesCard(page, 1).getByLabel('Décris la scène (facultatif)').fill('le lac est calme')
        await addLine(page, 1, 'Petit Zébu', 'Pourquoi je n’ai pas d’ailes ?')
        await nextStep(page)

        await expect(page.getByRole('heading', { name: 'Vérifier' })).toBeVisible()
        await page.getByRole('button', { name: 'Passer au studio' }).click()
        await expect(page).toHaveURL(/\/books\/.+\/studio/)
        bookId = page.url().split('/')[4] ?? ''

        const book = await apiJson<IBook>(page, `/books/${bookId}`)
        expect(book.lines).toHaveLength(4)
        expect(book.lines.every(line => line.memberId !== null)).toBeTruthy()
        expect(book.pages).toHaveLength(2)
        expect(book.pages[0]!.description).toBe('Un zébu près du lac Itasy')
        expect(book.characters.map(character => character.name)).toEqual(['Narrateur', 'Petit Zébu', 'Maman Zébu'])
        expect(book.characters[0]!.isNarrator).toBe(true)
        expect(book.characters[2]!.description).toBe('Une maman zébu très douce')
        expect(book.lines.map(line => line.tone)).toContain('Chuchoté')
        expect(book.lines.map(line => line.sceneDescription)).toContain('le lac est calme')
        expect(book.status).toBe('to_record')
    })

    test('shows the book as to record in the library', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await expect(page.locator('a.card', { hasText: `Le petit zébu ${info.project.name}` }).first()).toContainText('À enregistrer')
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
        await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
        await page.getByRole('button', { name: 'Suivant' }).click()
        await page.getByRole('button', { name: 'Précédent' }).click()
        await page.getByRole('button', { name: /1×/ }).click()
        await expect(page.getByRole('button', { name: /1.25×/ })).toBeVisible()
        await page.getByRole('button', { name: 'Pause' }).click()
        await expect(page.getByRole('button', { name: 'Lecture' })).toBeVisible()
        await page.locator('.card--tap', { hasText: 'Parce que tu as quatre pattes solides.' }).click()
        await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
    })

    test('shows the published book as ready and deletes another one', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await expect(page.locator('a.card', { hasText: `Le petit zébu ${info.project.name}` }).first()).toContainText('Prêt')
        const response = await page.request.post('/api/books', {
            data: { title: 'A supprimer', kind: 'multi', soloMemberId: null, imageDesc: '', pageFileIds: [], lines: [{ pageIndex: 0, character: '', text: 'x' }] },
        })
        const created = (await response.json()) as { id: string }
        await page.goto(`/books/${created.id}/studio`)
        page.once('dialog', dialog => dialog.accept())
        await page.getByRole('button', { name: 'Supprimer ce livre' }).click()
        await expect(page).toHaveURL(/\/home/)
        const list = await apiJson<{ id: string }[]>(page, '/books')
        expect(list.some(book => book.id === created.id)).toBeFalsy()
    })
})
