import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import type { IBook } from '../../shared/types/book'
import { apiJson, chooseProfile, login, nextStep, PARENT_NAME, recordAndSend, recordOnce, useProfile, pickOption, allowSpokenLanguages } from './helpers'

interface IFixture {
    bookId: string
    relativeName: string
}

const SPEECH_MOCK = (): void => {
    const w = window as any
    w.__spoken = []
    w.__cancelCount = 0
    w.SpeechSynthesisUtterance = class {
        text: string
        lang = ''
        rate = 1
        onend: (() => void) | null = null
        onerror: (() => void) | null = null
        constructor(text: string) {
            this.text = text
        }
    }
    Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: {
            speak: (utterance: any) => {
                w.__spoken.push(`${utterance.lang}|${utterance.text}`)
                setTimeout(() => utterance.onend?.(), 10)
            },
            cancel: () => {
                w.__cancelCount += 1
            },
            getVoices: () => [],
        },
    })
}

const spoken = (page: Page): Promise<string[]> => page.evaluate(() => (window as any).__spoken as string[])

const countUploads = (page: Page): { sessions: () => number; finishes: () => number } => {
    let sessions = 0
    let finishes = 0
    page.on('request', request => {
        const path = new URL(request.url()).pathname
        if (request.method() === 'POST' && path === '/api/uploads') {
            sessions += 1
        }
        if (request.method() === 'POST' && path.endsWith('/finish')) {
            finishes += 1
        }
    })
    return { sessions: () => sessions, finishes: () => finishes }
}

const prepare = async (page: Page): Promise<IFixture> => {
    await login(page)
    await chooseProfile(page, PARENT_NAME)
    const suffix = randomUUID().slice(0, 6)
    const relativeName = `Mamie${suffix}`
    const members = await apiJson<{ id: string; name: string }[]>(page, '/members')
    const parentId = members.find(member => member.name === PARENT_NAME)!.id
    const relative = await page.request.post('/api/members', { data: { name: relativeName, role: 'relative', color: 'coral' } })
    const { id: relativeId } = (await relative.json()) as { id: string }
    const created = await page.request.post('/api/books', {
        data: {
            title: `Studio ${suffix}`,
            kind: 'multi',
            imageDesc: '',
            pageFileIds: [],
            lines: [
                { pageIndex: 0, character: 'Narrateur', text: 'Il était une fois un zébu.', tone: 'Doux', sceneDescription: 'Un lac calme' },
                { pageIndex: 0, character: 'Zébu', text: 'Bonjour le lac !' },
                { pageIndex: 1, character: 'Mamie', text: 'Au revoir.' },
            ],
        },
    })
    const { id: bookId } = (await created.json()) as { id: string }
    const book = await apiJson<IBook>(page, `/books/${bookId}`)
    const memberIds = [parentId, parentId, relativeId]
    await page.request.patch(`/api/books/${bookId}`, {
        data: { lines: book.lines.map((line, index) => ({ id: line.id, memberId: memberIds[index] })) },
    })
    return { bookId, relativeName }
}

const openStudio = async (page: Page, fixture: IFixture): Promise<void> => {
    await page.goto(`/books/${fixture.bookId}/studio`)
    await expect(page.getByText('Il était une fois un zébu.').first()).toBeVisible()
}

const loadBook = (page: Page, fixture: IFixture): Promise<IBook> => apiJson<IBook>(page, `/books/${fixture.bookId}`)

test.describe.configure({ mode: 'serial' })

test.describe('recording studio', () => {
    test('teleprompter shows the line large with its hints and exits', async ({ page }) => {
        const fixture = await prepare(page)
        await openStudio(page, fixture)
        await page.getByRole('button', { name: 'Prompteur' }).click()
        const text = page.getByTestId('teleprompter-text')
        await expect(text).toBeVisible()
        await expect(text).toHaveText('Il était une fois un zébu.')
        const fontSize = await text.evaluate(element => parseFloat(getComputedStyle(element).fontSize))
        expect(fontSize).toBeGreaterThanOrEqual(28)
        await expect(page.getByText('Ton : Doux')).toBeVisible()
        await expect(page.getByText('Scène : Un lac calme')).toBeVisible()
        const box = await page.getByRole('button', { name: 'Enregistrer' }).boundingBox()
        expect(box!.width).toBeGreaterThanOrEqual(44)
        await page.getByRole('button', { name: 'Quitter le prompteur' }).click()
        await expect(page.getByRole('button', { name: 'Prompteur' })).toBeVisible()
    })

    test('speech assist reads the line, is toggled on the fly and never ends up in a recording', async ({ page }) => {
        await page.addInitScript(SPEECH_MOCK)
        const fixture = await prepare(page)
        await openStudio(page, fixture)
        await expect(page.getByRole('button', { name: 'Aide vocale' })).toHaveAttribute('aria-pressed', 'false')
        await page.getByRole('button', { name: 'Aide vocale' }).click()
        await expect(page.getByRole('button', { name: 'Aide vocale' })).toHaveAttribute('aria-pressed', 'true')
        await expect.poll(async () => (await spoken(page)).length).toBe(3)
        const heard = await spoken(page)
        expect(heard.every(item => item.startsWith('fr|'))).toBe(true)
        expect(heard.join(' ')).toContain('Il était une fois un zébu.')
        expect(heard.join(' ')).toContain('Doux')
        expect(heard.join(' ')).toContain('Un lac calme')
        await page.getByRole('button', { name: 'Scène', exact: true }).click()
        await page.getByRole('button', { name: 'Relire l’aide' }).click()
        await expect.poll(async () => (await spoken(page)).length).toBe(5)
        expect((await spoken(page)).slice(3).join(' ')).not.toContain('Un lac calme')
        const before = (await spoken(page)).length
        await page.getByRole('button', { name: 'Enregistrer' }).click()
        await expect(page.getByRole('button', { name: 'Arrêter' })).toBeVisible()
        expect(await page.evaluate(() => (window as any).__cancelCount as number)).toBeGreaterThan(0)
        await page.waitForTimeout(600)
        await page.getByRole('button', { name: 'Arrêter' }).click()
        expect((await spoken(page)).length).toBe(before)
        await page.getByRole('button', { name: 'Annuler' }).click()
        await page.getByRole('button', { name: 'Aide vocale' }).click()
        await expect(page.getByRole('button', { name: 'Aide vocale' })).toHaveAttribute('aria-pressed', 'false')
        expect((await loadBook(page, fixture)).recordings).toHaveLength(0)
    })

    test('a take can be replayed, cancelled without upload, then sent once', async ({ page }) => {
        const fixture = await prepare(page)
        const uploads = countUploads(page)
        await openStudio(page, fixture)
        await recordOnce(page)
        await expect(page.getByLabel('Prise à écouter')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Enregistrer' })).toHaveCount(0)
        await page.getByRole('button', { name: 'Annuler' }).click()
        await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeVisible()
        expect(uploads.sessions()).toBe(0)
        expect((await loadBook(page, fixture)).recordings).toHaveLength(0)
        await recordAndSend(page)
        await expect(page.locator('.studio__voice', { hasText: PARENT_NAME }).first()).toContainText('1/2')
        expect(uploads.sessions()).toBe(1)
        expect(uploads.finishes()).toBe(1)
        const book = await loadBook(page, fixture)
        expect(book.recordings).toHaveLength(1)
        expect(book.recordings[0]).toMatchObject({ language: 'fr', status: 'draft' })
        expect(book.recordings[0]!.mime).toMatch(/^audio\/(webm|mp4|ogg)/)
        await expect(page.getByTestId('teleprompter-text')).toHaveText('Bonjour le lac !')
        console.log(`opus take of ${book.recordings[0]!.durationMs} ms: see sizes in README`)
        const file = await page.request.get(`/api/files/${book.recordings[0]!.fileId}`)
        const bytes = (await file.body()).length
        console.log(`recorded ${book.recordings[0]!.mime} ${bytes} bytes for ${book.recordings[0]!.durationMs} ms`)
        expect(bytes / (book.recordings[0]!.durationMs / 1000)).toBeLessThan(6000)
    })

    test('the language is chosen with chips and stored with the recording', async ({ page }) => {
        const fixture = await prepare(page)
        await allowSpokenLanguages(page.request, ['fr', 'mg'])
        await openStudio(page, fixture)
        const languages = page.getByRole('group', { name: 'Langue de l’enregistrement' })
        await expect(languages.getByRole('button', { name: /Français/ })).toBeVisible()
        await languages.getByRole('button', { name: /Malagasy/ }).click()
        await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeEnabled()
        await recordAndSend(page)
        await expect(page.locator('.studio__voice', { hasText: PARENT_NAME }).first()).toContainText('1/2')
        const book = await loadBook(page, fixture)
        expect(book.recordings.map(item => item.language)).toEqual(['mg'])
    })

    test('a recording stops by itself at the limit and shows a countdown', async ({ page }) => {
        await page.addInitScript(() => {
            ;(window as any).__TANTARA_MAX_RECORDING_MS__ = 2500
        })
        const fixture = await prepare(page)
        await openStudio(page, fixture)
        await page.getByRole('button', { name: 'Enregistrer' }).click()
        await expect(page.getByTestId('countdown')).toContainText('Reste')
        await expect(page.getByRole('button', { name: 'Envoyer' })).toBeVisible({ timeout: 10_000 })
        await expect(page.getByText('Durée maximale atteinte')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Arrêter' })).toHaveCount(0)
        await page.getByRole('button', { name: 'Envoyer', exact: true }).click()
        await expect(page.locator('.studio__voice', { hasText: PARENT_NAME }).first()).toContainText('1/2')
        const book = await loadBook(page, fixture)
        expect(book.recordings[0]!.durationMs).toBeLessThanOrEqual(2500)
        expect(book.recordings[0]!.durationMs).toBeGreaterThan(1500)
    })

    test('the coverage table lists missing voices per language and jumps to a line', async ({ page }) => {
        const fixture = await prepare(page)
        await allowSpokenLanguages(page.request, ['fr', 'mg'])
        await openStudio(page, fixture)
        await recordAndSend(page)
        await expect(page.locator('.studio__voice', { hasText: PARENT_NAME }).first()).toContainText('1/2')
        const coverage = page.getByRole('region', { name: 'Couverture des voix' })
        await expect(coverage).toBeVisible()
        await expect(coverage.getByRole('button', { name: /Page 1, Narrateur, .*Français : fait/ })).toBeVisible()
        await expect(coverage.getByRole('button', { name: /Page 1, Zébu, .*Français : manquant/ })).toBeVisible()
        await expect(coverage.getByRole('button', { name: /Page 2, Mamie, .*Français : manquant/ })).toBeVisible()
        await expect(coverage.getByText(/Français 1\/2/)).toBeVisible()
        await expect(coverage.getByText(fixture.relativeName)).toBeVisible()
        await page.getByTestId('studio-language-mg').click()
        await expect(coverage.getByRole('button', { name: /Page 1, Zébu, .*Malagasy : manquant/ })).toBeVisible()
        await coverage.getByRole('button', { name: /Page 2, Mamie, .*Français : manquant/ }).click()
        await expect(page.getByTestId('studio-language-fr')).toHaveAttribute('aria-pressed', 'true')
        await expect(page.getByTestId('teleprompter-text')).toHaveText('Au revoir.')
        await page.locator('.studio__voice', { hasText: fixture.relativeName }).click()
        await expect(page.getByTestId('teleprompter-text')).toHaveText('Au revoir.')
    })

    test('a relative only sees the lines assigned to them', async ({ page }) => {
        const fixture = await prepare(page)
        await page.request.post('/api/auth/profile', { data: { memberId: null } })
        await useProfile(page.request, fixture.relativeName)
        await page.goto(`/books/${fixture.bookId}/studio`)
        await expect(page.getByTestId('teleprompter-text')).toHaveText('Au revoir.')
        await expect(page.getByText('Il était une fois un zébu.')).toHaveCount(0)
        await expect(page.locator('.studio__voice')).toHaveCount(1)
        await expect(page.getByRole('button', { name: 'Supprimer ce livre' })).toHaveCount(0)
    })

    test('page scans are converted to a small WebP of at most 1200 px', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const original = await page.evaluate(async () => {
            const canvas = document.createElement('canvas')
            canvas.width = 3000
            canvas.height = 2000
            const context = canvas.getContext('2d')!
            const gradient = context.createLinearGradient(0, 0, 3000, 2000)
            gradient.addColorStop(0, '#f6d365')
            gradient.addColorStop(1, '#2b5876')
            context.fillStyle = gradient
            context.fillRect(0, 0, 3000, 2000)
            for (let i = 0; i < 400; i++) {
                context.fillStyle = `hsla(${(i * 37) % 360}, 70%, 50%, 0.4)`
                context.beginPath()
                context.arc((i * 733) % 3000, (i * 421) % 2000, 20 + (i % 90), 0, Math.PI * 2)
                context.fill()
            }
            context.fillStyle = '#111'
            context.font = '64px sans-serif'
            for (let line = 0; line < 20; line++) {
                context.fillText('Il était une fois un petit zébu au bord du lac', 80, 100 + line * 90)
            }
            const blob: Blob = await new Promise(resolve => canvas.toBlob(result => resolve(result!), 'image/jpeg', 0.92))
            const buffer = new Uint8Array(await blob.arrayBuffer())
            let binary = ''
            buffer.forEach(byte => {
                binary += String.fromCharCode(byte)
            })
            return btoa(binary)
        })
        const jpeg = Buffer.from(original, 'base64')
        await page.goto('/library')
        await page.getByRole('link', { name: 'Nouveau livre' }).click()
        await page.getByLabel('Titre du livre').fill('Scan lourd')
        await nextStep(page)
        await expect(page.getByRole('heading', { name: 'Les pages' })).toBeVisible()
        const uploaded = page.waitForResponse(response => new URL(response.url()).pathname === '/api/files' && response.request().method() === 'POST')
        await page.getByTestId('add-photo-input').setInputFiles({ name: 'scan.jpg', mimeType: 'image/jpeg', buffer: jpeg })
        const response = await uploaded
        const mime = response.request().headers()['content-type']
        const { id } = (await response.json()) as { id: string }
        const stored = await page.request.get(`/api/files/${id}`)
        const storedBytes = (await stored.body()).length
        const dimensions = await page.evaluate(async (base64: string) => {
            const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0))
            const bitmap = await createImageBitmap(new Blob([bytes]))
            return { width: bitmap.width, height: bitmap.height }
        }, (await stored.body()).toString('base64'))
        console.log(`scan 3000x2000: jpeg q92 ${jpeg.length} bytes -> ${mime} ${storedBytes} bytes at ${dimensions.width}x${dimensions.height}`)
        expect(mime).toBe('image/webp')
        expect(stored.headers()['content-type']).toContain('image/webp')
        expect(Math.max(dimensions.width, dimensions.height)).toBeLessThanOrEqual(1200)
        expect(storedBytes).toBeLessThan(jpeg.length / 2)
        expect(storedBytes).toBeLessThan(300_000)
    })
})
