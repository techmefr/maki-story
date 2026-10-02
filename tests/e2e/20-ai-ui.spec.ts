import { expect, request, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { addLine, apiJson, chooseProfile, linesCard, makeWav, nextStep, PARENT_NAME, pngFile, signIn, startBook, uniqueAccount, useProfile } from './helpers'

test.skip(Boolean(process.env.E2E_BASE_URL), 'AI tests need the fake provider of the local server')

const openAsParent = async (page: Page): Promise<void> => {
    await signIn(page.request, uniqueAccount('ai-ui'))
    await chooseProfile(page, PARENT_NAME)
}

const exhaustBudget = async (api: APIRequestContext): Promise<void> => {
    for (let attempt = 0; attempt < 12; attempt++) {
        await api.post('/api/ai/translation', { data: { lines: [{ text: 'Bonjour' }], targetLanguage: 'mg' } })
    }
}

const publishAsParent = async (api: APIRequestContext, bookId: string): Promise<void> => {
    const members = (await (await api.get('/api/members')).json()) as IApiMember[]
    const parent = members.find(member => member.name === PARENT_NAME)!
    const book = (await (await api.get(`/api/books/${bookId}`)).json()) as { lines: { id: string }[] }
    await api.patch(`/api/books/${bookId}`, { data: { lines: book.lines.map(line => ({ id: line.id, memberId: parent.id })) } })
    for (const line of book.lines) {
        const upload = await api.post('/api/files', { data: makeWav(700), headers: { 'content-type': 'audio/wav' } })
        const fileId = ((await upload.json()) as { id: string }).id
        expect((await api.put(`/api/books/${bookId}/lines/${line.id}/audio`, { data: { fileId, ms: 700 } })).status()).toBe(200)
    }
    expect((await api.patch(`/api/books/${bookId}`, { data: { status: 'ready' } })).ok()).toBeTruthy()
}

const generateFromIdea = async (page: Page, idea: string): Promise<void> => {
    await page.goto('/home')
    await page.getByTestId('ai-create').click()
    await expect(page.getByRole('heading', { name: 'Créer une histoire avec l’IA' })).toBeVisible()
    await page.getByLabel('Ton idée d’histoire').fill(idea)
    await page.getByLabel('Nombre de pages').fill('2')
    await page.getByLabel('Décris le héros (facultatif)').fill('Un zébu brun avec une écharpe rouge')
    await page.getByRole('button', { name: 'Suivant', exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Les personnages' })).toBeVisible()
    await expect(page.getByLabel('Description').first()).toHaveValue('Un zébu brun avec une écharpe rouge')
}

test.describe('ai interface', () => {
    test.beforeEach(({ page }) => {
        page.on('dialog', dialog => dialog.accept())
    })

    test('a photo pre-fills a draft that the parent reviews and saves', async ({ page }) => {
        await openAsParent(page)
        await page.goto('/books/new')
        await page.getByRole('button', { name: 'Une seule voix' }).click()
        await page.getByTestId('ai-prefill-input').setInputFiles([pngFile('a.png')])
        await expect(page.getByText('Proposé par l’IA.')).toBeVisible()
        await expect(page.getByLabel('Titre du livre')).toHaveValue('Le petit zébu')
        await nextStep(page)
        await nextStep(page)
        await expect(page.getByRole('heading', { name: 'Les répliques' })).toBeVisible()
        await expect(page.getByText('Réplique 1', { exact: true })).toBeVisible()
        await expect(page.getByText('Réplique 4', { exact: true })).toBeVisible()
        await linesCard(page, 1).getByLabel('Retirer la réplique').first().click()
        await expect(page.getByText('Réplique 1', { exact: true })).toHaveCount(0)
        await nextStep(page)
        await page.getByRole('button', { name: 'Passer au studio' }).click()
        await expect(page).toHaveURL(/\/books\/.+\/studio/)
        const book = await apiJson<IBook>(page, `/books/${page.url().split('/')[4]}`)
        expect(book.title).toBe('Le petit zébu')
        expect(book.lines).toHaveLength(3)
        expect(book.aiGenerated).toBe(false)
        expect(book.status).not.toBe('draft')
    })

    test('an idea creates a hidden draft that children only see after validation', async ({ page, baseURL }) => {
        await openAsParent(page)
        await page.request.post('/api/members', { data: { name: 'Lova', role: 'child', color: 'sky', code: { kind: 'pin', value: '1234' } } })
        await generateFromIdea(page, 'Un zébu et un maki')
        await page.getByRole('button', { name: 'Générer l’histoire' }).click()
        await expect(page.getByTestId('ai-result')).toBeVisible()
        await expect(page.getByTestId('ai-images-skipped')).toHaveCount(0)
        await page.getByRole('link', { name: 'Voir dans la bibliothèque' }).click()
        const row = page.getByRole('region', { name: /À valider/ })
        await expect(row.getByText('Le petit zébu')).toBeVisible()
        await expect(row.getByText('Généré par l’IA')).toBeVisible()
        await expect(page.getByRole('region', { name: /Tous nos livres/ })).toHaveCount(0)

        const child = await request.newContext({ baseURL, storageState: await page.context().storageState() })
        await useProfile(child, 'Lova')
        expect(await (await child.get('/api/books')).json()).toEqual([])

        await row.getByRole('button', { name: 'Valider Le petit zébu' }).click()
        await expect(page.getByRole('region', { name: /À valider/ })).toHaveCount(0)
        await expect(page.getByRole('region', { name: /À enregistrer/ }).getByText('Le petit zébu')).toBeVisible()
        expect(await (await child.get('/api/books')).json()).toEqual([])

        const [summary] = (await (await page.request.get('/api/books')).json()) as IBookSummary[]
        expect(summary!.status).toBe('to_record')
        await publishAsParent(page.request, summary!.id)
        const visible = (await (await child.get('/api/books')).json()) as IBookSummary[]
        expect(visible.map(book => book.id)).toEqual([summary!.id])
        await child.dispose()
    })

    test('a draft can be rejected instead of validated', async ({ page }) => {
        await openAsParent(page)
        await generateFromIdea(page, 'Une histoire à jeter')
        await page.getByRole('button', { name: 'Générer l’histoire' }).click()
        await expect(page.getByTestId('ai-result')).toBeVisible()
        await page.getByRole('link', { name: 'Voir dans la bibliothèque' }).click()
        await page.getByRole('button', { name: 'Rejeter Le petit zébu' }).click()
        await expect(page.getByText('Aucun livre pour l’instant')).toBeVisible()
    })

    test('images skipped because of the budget are reported', async ({ page }) => {
        await openAsParent(page)
        for (let attempt = 0; attempt < 10; attempt++) {
            await page.request.post('/api/ai/translation', { data: { lines: [{ text: 'Bonjour' }], targetLanguage: 'mg' } })
        }
        await generateFromIdea(page, 'Une histoire presque sans image')
        await page.getByRole('button', { name: 'Générer l’histoire' }).click()
        await expect(page.getByTestId('ai-images-skipped')).toContainText('1 image n’a pas pu être créée')
    })

    test('a budget exhausted during generation shows a clear message', async ({ page }) => {
        await openAsParent(page)
        await generateFromIdea(page, 'Une histoire sans budget')
        await exhaustBudget(page.request)
        await page.getByRole('button', { name: 'Générer l’histoire' }).click()
        await expect(page.getByRole('alert').filter({ hasText: 'budget IA de ce mois est épuisé' })).toBeVisible()
        await page.goto('/home')
        await page.getByRole('button', { name: 'Mon profil' }).click()
        await expect(page.getByTestId('ai-quota')).toContainText('budget IA de ce mois est épuisé')
    })

    test('the remaining budget is shown in the profile menu and an unconfigured AI is unavailable', async ({ page }) => {
        await openAsParent(page)
        await page.goto('/home')
        await page.getByRole('button', { name: 'Mon profil' }).click()
        await expect(page.getByTestId('ai-quota')).toContainText('Budget IA du mois : il reste')
        await page.getByRole('button', { name: 'Fermer' }).click()

        await page.route('**/api/ai/status', route =>
            route.fulfill({ json: { enabled: false, monthlyBudgetUsd: 1, defaultBudgetUsd: 1, isCustomBudget: false, spentUsd: 0, remainingUsd: 1 } satisfies IAiStatus }),
        )
        await page.goto('/books/ai')
        await expect(page.getByRole('alert').filter({ hasText: 'L’IA n’est pas configurée' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Suivant', exact: true })).toBeDisabled()
        await page.goto('/books/new')
        await expect(page.getByRole('heading', { name: 'Pré-remplir depuis une photo' })).toBeVisible()
        await expect(page.getByText('L’IA n’est pas configurée').first()).toBeVisible()
        await expect(page.getByTestId('ai-prefill-input')).toBeDisabled()
    })

    test('a suggested translation is edited then accepted, or rejected, and saved only when accepted', async ({ page }) => {
        await openAsParent(page)
        await startBook(page, 'Livre traduit')
        await nextStep(page)
        await page.getByRole('button', { name: 'Continuer sans photo' }).click()
        await nextStep(page)
        await expect(page.getByRole('heading', { name: 'Les répliques' })).toBeVisible()
        await addLine(page, 1, null, 'Bonjour petit zébu')
        await addLine(page, 1, null, 'Au revoir petit zébu')
        const first = page.locator('.line', { hasText: 'Bonjour petit zébu' })
        await first.getByRole('button', { name: 'Suggérer une traduction' }).click()
        await expect(first.getByLabel('Traduire en')).toHaveValue('mg')
        await first.getByRole('button', { name: 'Suggérer', exact: true }).click()
        const field = first.getByLabel(/Traduction proposée en/)
        await expect(field).toHaveValue('[mg] 1')
        await field.fill('Salama kely zébu')
        await first.getByRole('button', { name: 'Accepter' }).click()
        await expect(first.getByText('Salama kely zébu')).toBeVisible()

        const second = page.locator('.line', { hasText: 'Au revoir petit zébu' })
        await second.getByRole('button', { name: 'Suggérer une traduction' }).click()
        await second.getByRole('button', { name: 'Suggérer', exact: true }).click()
        await expect(second.getByLabel(/Traduction proposée en/)).toHaveValue('[mg] 1')
        await second.getByRole('button', { name: 'Rejeter' }).click()
        await expect(second.getByLabel(/Traduction proposée en/)).toHaveCount(0)
        await second.getByRole('button', { name: 'Fermer' }).click()

        await nextStep(page)
        await page.getByRole('button', { name: 'Passer au studio' }).click()
        await expect(page).toHaveURL(/\/books\/.+\/studio/)
        const book = await apiJson<IBook>(page, `/books/${page.url().split('/')[4]}`)
        expect(book.translations).toHaveLength(1)
        expect(book.translations[0]).toMatchObject({ language: 'mg', text: 'Salama kely zébu' })
        const line = book.lines.find(item => item.text === 'Bonjour petit zébu')!
        expect(book.translations[0]!.lineId).toBe(line.id)
    })

    test('children see no AI entry', async ({ page }) => {
        await openAsParent(page)
        await page.goto('/home')
        await expect(page.getByTestId('ai-create')).toBeVisible()
        await page.request.post('/api/members', { data: { name: 'Lova', role: 'child', color: 'sky', code: { kind: 'pin', value: '1234' } } })
        await chooseProfile(page, 'Lova')
        await expect(page).toHaveURL(/\/kid/)
        await page.getByRole('button', { name: 'Mon profil' }).click()
        await expect(page.getByRole('heading', { name: 'Lova', exact: true })).toBeVisible()
        await expect(page.getByTestId('ai-quota')).toHaveCount(0)
        await page.getByRole('button', { name: 'Fermer' }).click()
        await page.goto('/books/ai')
        await expect(page).toHaveURL(/\/kid/)
        await expect(page.getByLabel('Ton idée d’histoire')).toHaveCount(0)
        await page.goto('/books/new')
        await expect(page).toHaveURL(/\/kid/)
    })
})
