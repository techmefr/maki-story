import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import type { IBook } from '../../shared/types/book'
import type { IPlaybackPlan } from '../../shared/types/playback'
import { chooseProfile, enterPin, makeWav, PROFILE_PIN, signIn, uniqueAccount, useProfile, pickOption, allowSpokenLanguages } from './helpers'

test.describe.configure({ mode: 'serial' })

interface IFixture {
    bookId: string
    lineIds: string[]
    files: Record<string, string[]>
}

const upload = async (api: APIRequestContext): Promise<string> => {
    const response = await api.post('/api/files', { data: makeWav(400), headers: { 'content-type': 'audio/wav' } })
    expect(response.ok()).toBeTruthy()
    return ((await response.json()) as { id: string }).id
}

const createBook = async (api: APIRequestContext, parentId: string, title: string, coverage: Record<string, boolean[]>): Promise<IFixture> => {
    const created = await api.post('/api/books', {
        data: {
            title,
            kind: 'multi',
            imageDesc: '',
            pageFileIds: [],
            lines: [
                { pageIndex: 0, character: 'Narrateur', text: 'Il était une fois.' },
                { pageIndex: 0, character: 'Zébu', text: 'Bonjour !' },
            ],
        },
    })
    const { id } = (await created.json()) as { id: string }
    const book = (await (await api.get(`/api/books/${id}`)).json()) as IBook
    await api.patch(`/api/books/${id}`, { data: { lines: book.lines.map(line => ({ id: line.id, memberId: parentId })) } })
    const files: Record<string, string[]> = {}
    for (const [language, flags] of Object.entries(coverage)) {
        files[language] = []
        for (const [index, isRecorded] of flags.entries()) {
            if (!isRecorded) {
                files[language]!.push('')
                continue
            }
            const fileId = await upload(api)
            files[language]!.push(fileId)
            const response = await api.put(`/api/books/${id}/lines/${book.lines[index]!.id}/audio`, { data: { fileId, ms: 400, language } })
            expect(response.ok()).toBeTruthy()
        }
    }
    for (const language of Object.keys(coverage).filter(code => code !== 'fr')) {
        const done = await api.put(`/api/books/${id}/translation-done`, { data: { language, isDone: true } })
        expect(done.ok()).toBeTruthy()
    }
    expect((await api.patch(`/api/books/${id}`, { data: { status: 'ready' } })).ok()).toBeTruthy()
    return { bookId: id, lineIds: book.lines.map(line => line.id), files }
}

const watchFiles = (page: Page): string[] => {
    const seen: string[] = []
    page.on('request', request => {
        const match = /\/api\/files\/([^/?]+)$/.exec(new URL(request.url()).pathname)
        if (match && request.method() === 'GET') {
            seen.push(match[1]!)
        }
    })
    return seen
}

test.describe('multilingual playback', () => {
    let api: APIRequestContext
    let parentId = ''
    let childId = ''
    let otherChildId = ''
    let rotation: IFixture
    let malagasy: IFixture
    let account = uniqueAccount('ml')

    const enterAs = async (page: Page, name: string): Promise<void> => {
        await signIn(page.request, account)
        await chooseProfile(page, name)
    }

    test.beforeAll(async ({ playwright, baseURL }, info) => {
        account = uniqueAccount(`ml-${info.project.name}`)
        api = await playwright.request.newContext({ baseURL })
        await signIn(api, account)
        parentId = await useProfile(api, 'Parent')
        for (const name of ['Lova', 'Tiana']) {
            const response = await api.post('/api/members', { data: { name, role: 'child', color: 'sky', code: { kind: 'pin', value: PROFILE_PIN } } })
            expect(response.ok()).toBeTruthy()
        }
        const members = (await (await api.get('/api/members')).json()) as { id: string; name: string }[]
        childId = members.find(member => member.name === 'Lova')!.id
        otherChildId = members.find(member => member.name === 'Tiana')!.id
        rotation = await createBook(api, parentId, 'Rotation', { fr: [true, true], mg: [true, false], en: [true, false] })
        malagasy = await createBook(api, parentId, 'Tantara malagasy', { fr: [true, true], mg: [true, true] })
    })

    test.afterAll(async () => {
        await api.dispose()
    })

    test('a parent translates each line into Malagasy with text and tone', async ({ page }) => {
        await enterAs(page, 'Parent')
        await allowSpokenLanguages(api, ['fr', 'mg'])
        await page.goto(`/books/${rotation.bookId}/translate`)
        await page.getByRole('group', { name: 'Langue de la traduction' }).getByRole('button', { name: /Malagasy/ }).click()
        await page.getByTestId('translate-text-0').fill('Fahiny teo, nisy ilay tantara.')
        await page.getByLabel('Ton (facultatif)').first().fill('doux')
        await page.getByTestId('translate-text-1').fill('Salama !')
        await page.getByRole('button', { name: 'Enregistrer la traduction' }).click()
        await expect(page.getByText('2 répliques enregistrées en Malagasy.')).toBeVisible()
        const book = (await (await api.get(`/api/books/${rotation.bookId}`)).json()) as IBook
        const mg = book.translations.filter(item => item.language === 'mg')
        expect(mg.map(item => item.text).sort()).toEqual(['Fahiny teo, nisy ilay tantara.', 'Salama !'])
        expect(mg.find(item => item.text === 'Salama !')!.tone).toBe('')
        expect(mg.find(item => item.text.startsWith('Fahiny'))!.tone).toBe('doux')
        await page.reload()
        await page.getByRole('group', { name: 'Langue de la traduction' }).getByRole('button', { name: /Malagasy/ }).click()
        await expect(page.getByTestId('translate-text-1')).toHaveValue('Salama !')
    })

    test('an AI suggestion fills editable fields', async ({ page }) => {
        await enterAs(page, 'Parent')
        await allowSpokenLanguages(api, ['fr', 'mg', 'en'])
        await page.goto(`/books/${rotation.bookId}/translate`)
        await page.getByRole('group', { name: 'Langue de la traduction' }).getByRole('button', { name: /English/ }).click()
        await page.getByRole('button', { name: 'Suggérer une traduction' }).click()
        await expect(page.getByText(/Suggestions à relire/)).toBeVisible()
        await expect(page.getByTestId('translate-text-0')).not.toHaveValue('')
        await page.getByTestId('translate-text-0').fill('Once upon a time.')
        await expect(page.getByTestId('translate-text-0')).toHaveValue('Once upon a time.')
    })

    test('the plan rotates languages per line and falls back when a recording is missing', async () => {
        const plan = async (languages: string): Promise<IPlaybackPlan> =>
            (await (await api.get(`/api/books/${rotation.bookId}/playback?languages=${languages}`)).json()) as IPlaybackPlan
        const rotated = await plan('fr,mg,fr')
        expect(rotated.steps.map(step => [step.lineId, step.language])).toEqual([
            [rotation.lineIds[0], 'fr'],
            [rotation.lineIds[0], 'mg'],
            [rotation.lineIds[0], 'fr'],
            [rotation.lineIds[1], 'fr'],
        ])
        expect(rotated.steps.map(step => step.fileId)).toEqual([
            rotation.files.fr![0],
            rotation.files.mg![0],
            rotation.files.fr![0],
            rotation.files.fr![1],
        ])
        const four = await plan('fr,mg,fr,en')
        expect(four.steps.filter(step => step.lineId === rotation.lineIds[0]).map(step => step.language)).toEqual(['fr', 'mg', 'fr', 'en'])
        const fallback = await plan('mg')
        expect(fallback.steps.map(step => [step.language, step.isFallback])).toEqual([
            ['mg', false],
            ['fr', true],
        ])
        expect(fallback.available.map(item => item.code)).toEqual(['fr', 'en', 'mg'])
        expect((await api.get(`/api/books/${rotation.bookId}/playback?languages=xx`)).status()).toBe(400)
    })

    test('a child plays the saved fr, mg, fr rotation in order with one tap', async ({ page }) => {
        const saved = await api.put(`/api/members/${childId}/language-config`, {
            data: { bookId: rotation.bookId, languages: ['fr', 'mg', 'fr'] },
        })
        expect(saved.ok()).toBeTruthy()
        await enterAs(page, 'Lova')
        const seen = watchFiles(page)
        await page.addInitScript(`
            window.played = []
            const original = HTMLMediaElement.prototype.play
            HTMLMediaElement.prototype.play = function () {
                window.played.push(this.src)
                return original.call(this)
            }
        `)
        await page.goto(`/kid/listen/${rotation.bookId}`)
        await expect(page.getByTestId('change-language')).toBeVisible()
        await page.getByRole('button', { name: 'Lire' }).click()
        await expect(page.getByText('C’est fini !')).toBeVisible({ timeout: 30000 })
        expect(seen).toEqual([rotation.files.fr![0], rotation.files.mg![0], rotation.files.fr![1]])
        const played = await page.evaluate(() => (window as unknown as { played: string[] }).played)
        expect(played).toHaveLength(4)
        expect(played[2]).toBe(played[0])
        expect(played[1]).not.toBe(played[0])
        expect(played[3]).not.toBe(played[0])
    })

    test('Malagasy plays end to end from the flag screen', async ({ page }) => {
        await enterAs(page, 'Tiana')
        const seen = watchFiles(page)
        await page.goto(`/kid/listen/${malagasy.bookId}`)
        await expect(page.getByRole('group', { name: 'Langues de l’histoire' })).toBeVisible()
        await page.locator('[data-choice="mg"]').click()
        await expect(page.getByTestId('change-language')).toBeVisible()
        await page.getByRole('button', { name: 'Lire' }).click()
        await expect(page.getByText('C’est fini !')).toBeVisible({ timeout: 30000 })
        expect(seen).toEqual(malagasy.files.mg)
    })

    test('the selection screen offers full flags and split flags', async ({ page }) => {
        await api.put(`/api/members/${otherChildId}/language-config`, { data: { bookId: rotation.bookId, languages: ['fr'] } })
        await enterAs(page, 'Tiana')
        await page.goto(`/kid/listen/${rotation.bookId}`)
        await page.getByTestId('change-language').click()
        const choices = page.getByRole('group', { name: 'Langues de l’histoire' })
        await expect(choices.locator('[data-choice]')).toHaveCount(6)
        await expect(choices.locator('svg[data-flag="fr"]')).toBeVisible()
        await expect(choices.locator('svg[data-flag="fr-mg"]')).toBeVisible()
        await expect(choices.getByRole('button', { name: 'Français puis Malagasy' })).toBeVisible()
        const seen = watchFiles(page)
        await choices.getByRole('button', { name: 'Français puis Malagasy' }).click()
        await page.getByRole('button', { name: 'Lire' }).click()
        await expect(page.getByText('C’est fini !')).toBeVisible({ timeout: 30000 })
        expect(seen).toEqual([rotation.files.fr![0], rotation.files.mg![0], rotation.files.fr![1]])
    })

    test('the padlock keeps the child from changing the language until a parent unlocks it', async ({ page }) => {
        await enterAs(page, 'Tiana')
        await page.goto(`/kid/listen/${malagasy.bookId}`)
        await page.getByTestId('language-lock').click()
        await expect(page.getByRole('dialog', { name: 'Code d’un parent' })).toBeVisible()
        await enterPin(page, '999999')
        await expect(page.getByText('Ce code ne convient pas.')).toBeVisible()
        await enterPin(page, PROFILE_PIN)
        await expect(page.getByTestId('change-language')).toHaveCount(0)
        await expect(page.getByTestId('current-language')).toBeVisible()
        await page.reload()
        await expect(page.getByTestId('current-language')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Lire' })).toBeVisible()

        const blocked = await page.request.put(`/api/members/${otherChildId}/language-config`, {
            data: { bookId: malagasy.bookId, languages: ['fr'] },
        })
        expect(blocked.status()).toBe(403)
        const forced = (await (await page.request.get(`/api/books/${malagasy.bookId}/playback?languages=fr`)).json()) as IPlaybackPlan
        expect(forced.languages).toEqual(['mg'])
        const noProof = await page.request.put(`/api/members/${otherChildId}/language-lock`, { data: { bookId: malagasy.bookId, isLocked: false } })
        expect(noProof.status()).toBe(403)
        const wrongProof = await page.request.put(`/api/members/${otherChildId}/language-lock`, {
            data: { bookId: malagasy.bookId, isLocked: false, parentId, code: '0000' },
        })
        expect(wrongProof.status()).toBe(403)

        await page.getByTestId('language-lock').click()
        await enterPin(page, PROFILE_PIN)
        await expect(page.getByTestId('change-language')).toBeVisible()
        const unlocked = await page.request.put(`/api/members/${otherChildId}/language-config`, {
            data: { bookId: malagasy.bookId, languages: ['fr'] },
        })
        expect(unlocked.ok()).toBeTruthy()
    })

    test('children only get ready books in their plan', async ({ playwright, baseURL }) => {
        const draft = await createBook(api, parentId, 'Brouillon', { fr: [true, true] })
        expect((await api.patch(`/api/books/${draft.bookId}`, { data: { status: 'draft' } })).ok()).toBeTruthy()
        const child = await playwright.request.newContext({ baseURL })
        await signIn(child, account)
        await useProfile(child, 'Lova')
        expect((await child.get(`/api/books/${draft.bookId}/playback`)).status()).toBe(404)
        expect((await child.get(`/api/books/${rotation.bookId}/playback`)).status()).toBe(200)
        await child.dispose()
    })
})
