import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { addLine, apiJson, chooseProfile, login, pngFile, recordOnce, uniqueName } from './helpers'

test.describe.configure({ mode: 'serial' })

const castCharacter = async (page: Page, character: string, member: string): Promise<void> => {
    const card = page.locator('.card', { has: page.locator('.subtitle', { hasText: character }) }).filter({ has: page.locator('.picker') })
    await card.locator('.picker', { hasText: member }).click()
}

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

    test('creates a book with photos, two pages and cast voices', async ({ page }, info) => {
        const project = info.project.name
        const mamie = uniqueName('Mamie', project)
        const lova = uniqueName('Lova', project)
        await login(page)
        await chooseProfile(page, 'Parent')
        await page.getByRole('link', { name: 'Nouveau livre' }).click()
        await page.getByRole('button', { name: /Plusieurs voix/ }).click()

        await expect(page.getByRole('heading', { name: 'Scanner les pages' })).toBeVisible()
        await expect(page.getByText('1/4')).toBeVisible()
        await page.locator('input[type=file]').setInputFiles([pngFile('p1.png'), pngFile('p2.png')])
        await expect(page.locator('.thumb')).toHaveCount(2)
        await page.locator('.thumb__remove').last().click()
        await expect(page.locator('.thumb')).toHaveCount(1)
        await page.locator('input[type=file]').setInputFiles(pngFile('p2.png'))
        await expect(page.locator('.thumb')).toHaveCount(2)
        await page.getByRole('button', { name: 'Suivant' }).click()

        await expect(page.getByRole('heading', { name: 'Les répliques' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Suivant' })).toBeDisabled()
        await addLine(page, 1, 'Narrateur', 'Au bord du lac, le zébu regardait les oiseaux.')
        await addLine(page, 1, 'Petit Zébu', 'Pourquoi je n’ai pas d’ailes ?')
        await addLine(page, 2, 'Maman Zébu', 'Parce que tu as quatre pattes solides.')
        await addLine(page, 2, 'Narrateur', 'Et le lémurien bondit de branche en branche.')
        await page.locator('.card', { has: page.getByText('Page 1', { exact: true }) }).getByRole('button', { name: '×' }).last().click()
        await addLine(page, 1, 'Petit Zébu', 'Pourquoi je n’ai pas d’ailes ?')
        await page.getByRole('button', { name: 'Suivant' }).click()

        await expect(page.getByRole('heading', { name: 'Colorier les voix' })).toBeVisible()
        await expect(page.getByRole('button', { name: /Encore 4 répliques à colorier/ })).toBeDisabled()
        await page.getByPlaceholder('Un petit zébu au bord d’un lac…').fill('Un zébu près du lac Itasy')
        await castCharacter(page, 'Narrateur', 'Parent')
        await castCharacter(page, 'Petit Zébu', lova)
        await expect(page.getByRole('button', { name: /Encore 1 répliques à colorier/ })).toBeDisabled()
        await castCharacter(page, 'Maman Zébu', mamie)
        await expect(page.getByText('3/3 personnages ont une voix.')).toBeVisible()
        await page.getByPlaceholder('Douce, grave, joyeuse…').first().fill('Voix douce')
        await page.getByPlaceholder('chuchoté, en riant…').first().fill('en chuchotant')
        await page.getByRole('button', { name: 'Suivant' }).click()

        await expect(page.getByRole('heading', { name: 'Vérifier' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Passer au studio' })).toBeDisabled()
        await page.getByPlaceholder('Le Zébu qui voulait voler').fill(`Le petit zébu ${project}`)
        await page.getByRole('button', { name: 'Passer au studio' }).click()
        await expect(page).toHaveURL(/\/books\/.+\/studio/)
        bookId = page.url().split('/')[4] ?? ''

        const book = await apiJson<{ lines: { memberId: string | null; note: string }[]; tones: Record<string, string>; imageDesc: string; pages: unknown[]; status: string }>(page, `/books/${bookId}`)
        expect(book.lines).toHaveLength(4)
        expect(book.lines.every(line => line.memberId !== null)).toBeTruthy()
        expect(book.pages).toHaveLength(2)
        expect(book.imageDesc).toBe('Un zébu près du lac Itasy')
        expect(Object.values(book.tones)).toContain('Voix douce')
        expect(book.lines.map(line => line.note)).toContain('en chuchotant')
        expect(book.status).toBe('to_record')
    })

    test('shows the book as to record in the library', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, 'Parent')
        await expect(page.locator('a.card', { hasText: `Le petit zébu ${info.project.name}` })).toContainText('À enregistrer')
    })

    test('records every line in the studio and publishes', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        await chooseProfile(page, 'Parent')
        await page.goto(`/books/${bookId}/studio`)
        await expect(page.getByText('Au bord du lac, le zébu regardait les oiseaux.').first()).toBeVisible()
        await expect(page.getByRole('button', { name: /Enregistre toutes les répliques/ })).toBeDisabled()
        await expect(page.getByText('Voix douce').first()).toBeVisible()
        await recordMemberLines(page, 'Parent')
        await expect(page.getByRole('button', { name: 'Écouter' })).toBeEnabled()
        await page.getByRole('button', { name: 'Refaire' }).click()
        await expect(page.getByRole('button', { name: 'Écouter' })).toBeDisabled()
        await recordMemberLines(page, 'Parent')
        await recordMemberLines(page, uniqueName('Lova', project))
        await recordMemberLines(page, uniqueName('Mamie', project))
        await expect(page.getByRole('button', { name: 'Publier le livre' })).toBeEnabled()
        await page.getByRole('button', { name: 'Publier le livre' }).click()
        await expect(page).toHaveURL(/\/play$/)
        const book = await apiJson<{ status: string; lines: { audioFileId: string | null; audioMs: number }[] }>(page, `/books/${bookId}`)
        expect(book.status).toBe('ready')
        expect(book.lines.every(line => line.audioFileId !== null && line.audioMs > 500)).toBeTruthy()
    })

    test('plays the book from the parent reader', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, 'Parent')
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
        await chooseProfile(page, 'Parent')
        await expect(page.locator('a.card', { hasText: `Le petit zébu ${info.project.name}` })).toContainText('Prêt')
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

test.describe('casting by line', () => {
    test('assigns each line separately', async ({ page }, info) => {
        const lova = uniqueName('Lova', info.project.name)
        await login(page)
        await chooseProfile(page, 'Parent')
        await page.goto('/books/new')
        await page.getByRole('button', { name: /Plusieurs voix/ }).click()
        await page.getByRole('button', { name: 'Continuer sans photo' }).click()
        await addLine(page, 1, 'Narrateur', 'Première phrase.')
        await addLine(page, 1, 'Narrateur', 'Deuxième phrase.')
        await page.getByRole('button', { name: 'Suivant' }).click()
        await page.getByRole('button', { name: 'Par réplique' }).click()
        const first = page.locator('.card', { hasText: 'Première phrase.' }).filter({ has: page.locator('.picker') })
        await first.locator('.picker', { hasText: 'Parent' }).click()
        await expect(page.getByRole('button', { name: /Encore 1 répliques à colorier/ })).toBeDisabled()
        const second = page.locator('.card', { hasText: 'Deuxième phrase.' }).filter({ has: page.locator('.picker') })
        await second.locator('.picker', { hasText: lova }).click()
        await page.getByRole('button', { name: 'Suivant' }).click()
        await page.getByPlaceholder('Le Zébu qui voulait voler').fill(`Par réplique ${info.project.name}`)
        await page.getByRole('button', { name: 'Passer au studio' }).click()
        await expect(page).toHaveURL(/\/studio/)
        await expect(page.locator('.picker', { hasText: 'Parent' })).toBeVisible()
        await expect(page.locator('.picker', { hasText: lova })).toBeVisible()
    })
})
