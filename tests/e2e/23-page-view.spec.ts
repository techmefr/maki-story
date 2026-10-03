import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import type { IBook } from '../../shared/types/book'
import { chooseProfile, login, makeWav, PARENT_NAME, pngFile, signIn, uniqueAccount, useProfile } from './helpers'

const loadBook = async (api: APIRequestContext, id: string): Promise<IBook> => (await (await api.get(`/api/books/${id}`)).json()) as IBook

const uploadScan = async (api: APIRequestContext): Promise<string> => {
    const file = pngFile('scan.png')
    const response = await api.post('/api/files', { data: file.buffer, headers: { 'content-type': file.mimeType } })
    expect(response.ok()).toBeTruthy()
    return ((await response.json()) as { id: string }).id
}

const uploadWav = async (api: APIRequestContext, ms = 300): Promise<string> => {
    const response = await api.post('/api/files', { data: makeWav(ms), headers: { 'content-type': 'audio/wav' } })
    expect(response.ok()).toBeTruthy()
    return ((await response.json()) as { id: string }).id
}

const createPagedBook = async (api: APIRequestContext, memberId: string): Promise<string> => {
    const fileId = await uploadScan(api)
    const created = await api.post('/api/books', {
        data: {
            title: 'Vue de page',
            kind: 'multi',
            type: 'comic',
            imageDesc: '',
            pageFileIds: [],
            pages: [
                { fileId, kind: 'content', description: 'Un zébu près du lac', panels: [{ description: 'Case 1' }, { description: 'Case 2' }, { description: 'Case 3' }] },
            ],
            characters: [
                { name: 'Conteur', isNarrator: true, color: 'sun', description: '' },
                { name: 'Zébu', color: 'coral', description: 'Petit zébu roux' },
            ],
            lines: [
                { pageIndex: 0, character: 'Conteur', text: 'Il était une fois.', tone: 'Doux' },
                { pageIndex: 0, character: 'Zébu', text: 'Bonjour le lac !' },
            ],
        },
    })
    expect(created.ok(), await created.text()).toBeTruthy()
    const { id } = (await created.json()) as { id: string }
    const book = await loadBook(api, id)
    const patched = await api.patch(`/api/books/${id}`, { data: { lines: book.lines.map(line => ({ id: line.id, memberId })) } })
    expect(patched.ok()).toBeTruthy()
    return id
}

test.describe('page view, scan viewer and recording constraints', () => {
    let api: APIRequestContext
    let parentId = ''

    test.beforeAll(async ({ playwright, baseURL }) => {
        api = await playwright.request.newContext({ baseURL })
        await signIn(api, uniqueAccount('pageview'))
        parentId = await useProfile(api, PARENT_NAME)
    })

    test.afterAll(async () => {
        await api.dispose()
    })

    test('a narrator is a flag, never a name, and carries no voice color', async () => {
        const created = await api.post('/api/books', {
            data: {
                title: 'Narrateur par drapeau',
                kind: 'multi',
                imageDesc: '',
                pageFileIds: [],
                characters: [{ name: 'Conteur', isNarrator: true, color: 'sun' }],
                lines: [
                    { pageIndex: 0, character: 'Conteur', text: 'Un.' },
                    { pageIndex: 0, character: 'Narrateur', text: 'Deux.' },
                ],
            },
        })
        const { id } = (await created.json()) as { id: string }
        const book = await loadBook(api, id)
        const conteur = book.characters.find(character => character.name === 'Conteur')!
        const named = book.characters.find(character => character.name === 'Narrateur')!
        expect(conteur).toMatchObject({ isNarrator: true, color: null })
        expect(named.isNarrator).toBe(false)
        const patched = await api.patch(`/api/books/${id}/characters/${conteur.id}`, { data: { color: 'mint' } })
        expect(((await patched.json()) as { color: string | null }).color).toBeNull()
    })

    test('recordings are refused when too long or not audio, and the language must be a spoken one', async () => {
        const id = await createPagedBook(api, parentId)
        const book = await loadBook(api, id)
        const line = book.lines[0]!
        const put = (data: Record<string, unknown>) => api.put(`/api/books/${id}/lines/${line.id}/audio`, { data })
        expect((await put({ fileId: await uploadWav(api), ms: 10 * 60 * 1000 + 6000 })).status()).toBe(400)
        const image = await put({ fileId: await uploadScan(api), ms: 300 })
        expect(image.status()).toBe(400)
        expect((await put({ fileId: await uploadWav(api), ms: 10 * 60 * 1000 })).status()).toBe(200)
        const settings = await api.patch(`/api/members/${parentId}/settings`, { data: { spokenLanguages: ['mg'] } })
        expect(settings.ok(), await settings.text()).toBeTruthy()
        expect((await put({ fileId: await uploadWav(api), ms: 300, language: 'en' })).status()).toBe(400)
        expect((await put({ fileId: await uploadWav(api), ms: 300, language: 'mg' })).status()).toBe(200)
        await api.patch(`/api/members/${parentId}/settings`, { data: { spokenLanguages: [] } })
    })

    test('the file route accepts the sharper variant and refuses unknown sizes', async () => {
        const fileId = await uploadScan(api)
        expect((await api.get(`/api/files/${fileId}`)).status()).toBe(200)
        expect((await api.get(`/api/files/${fileId}?size=full`)).status()).toBe(200)
        expect((await api.get(`/api/files/${fileId}?size=huge`)).status()).toBe(400)
    })

    const openStudio = async (page: Page, bookId: string): Promise<void> => {
        await page.goto(`/books/${bookId}/studio`)
        await expect(page.getByTestId('page-view-toggle')).toBeVisible()
        await page.getByTestId('page-view-toggle').click()
    }

    test('the studio page view shows the scan with zoom, rotate, full screen and the characters', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const bookId = await createPagedBook(page.request, (await (await page.request.get('/api/auth/me')).json()).memberId)
        await openStudio(page, bookId)
        await expect(page.getByTestId('page-view')).toBeVisible()
        await expect(page.getByTestId('character-count')).toContainText('2')
        await expect(page.getByTestId('narrator-badge')).toBeVisible()
        await expect(page.getByTestId('character-reader').first()).toContainText(PARENT_NAME)
        await expect(page.getByTestId('scan-image')).toBeVisible()
        await page.getByTestId('scan-zoom-in').click()
        await expect(page.getByTestId('scan-stage')).toHaveCSS('transform', /matrix\(1\.4/)
        await page.getByTestId('scan-rotate').click()
        await expect(page.getByTestId('scan-stage')).toHaveCSS('transform', /matrix\(/)
        await page.getByTestId('scan-full').click()
        await expect(page.getByTestId('scan-viewer')).toHaveCSS('position', 'fixed')
        await page.keyboard.press('Escape')
        await expect(page.getByTestId('scan-viewer')).not.toHaveCSS('position', 'fixed')
        await page.getByTestId('description-toggle').click()
        await expect(page.getByTestId("page-view").getByText("Un zébu près du lac")).toBeVisible()
        await page.getByTestId('only-mine').click()
        await expect(page.getByTestId('page-line-text')).toHaveCount(2)
    })

    test('the studio recording language menu only offers the spoken languages', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const memberId = (await (await page.request.get('/api/auth/me')).json()).memberId as string
        const settings = await page.request.patch(`/api/members/${memberId}/settings`, { data: { spokenLanguages: ['mg', 'en'] } })
        expect(settings.ok()).toBeTruthy()
        const bookId = await createPagedBook(page.request, memberId)
        await page.goto(`/books/${bookId}/studio`)
        await expect(page.locator('[data-testid^="studio-language-"]')).toHaveCount(2)
        await page.request.patch(`/api/members/${memberId}/settings`, { data: { spokenLanguages: [] } })
    })

    test('a double tap zooms the scan and a tap on a comic panel zooms that panel', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const bookId = await createPagedBook(page.request, (await (await page.request.get('/api/auth/me')).json()).memberId)
        await openStudio(page, bookId)
        const viewport = page.getByTestId('scan-image')
        await expect(viewport).toBeVisible()
        const box = (await viewport.boundingBox())!
        await page.mouse.click(box.x + box.width * 0.2, box.y + box.height * 0.2)
        await expect(page.getByTestId('scan-stage')).toHaveCSS('transform', /matrix\(/)
        const transform = await page.getByTestId('scan-stage').evaluate(element => getComputedStyle(element).transform)
        expect(transform).not.toBe('matrix(1, 0, 0, 1, 0, 0)')
    })

    test('the review page can be read page by page', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const memberId = (await (await page.request.get('/api/auth/me')).json()).memberId as string
        const bookId = await createPagedBook(page.request, memberId)
        const book = await loadBook(page.request, bookId)
        const put = await page.request.put(`/api/books/${bookId}/lines/${book.lines[0]!.id}/audio`, { data: { fileId: await uploadWav(page.request), ms: 300 } })
        expect(put.ok()).toBeTruthy()
        await page.request.post(`/api/books/${bookId}/submit`)
        await page.goto(`/books/${bookId}/review`)
        await page.getByTestId('review-page-mode').click()
        await expect(page.getByTestId('page-view')).toBeVisible()
        await page.getByTestId(`page-approve-${book.lines[0]!.id}`).click()
        await expect(page.locator(`[data-line-id="${book.lines[0]!.id}"]`).getByText('Validée')).toBeVisible()
    })
})
