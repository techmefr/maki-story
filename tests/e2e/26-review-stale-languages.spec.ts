import { expect, test } from '@playwright/test'
import type { APIRequestContext, Playwright } from '@playwright/test'
import type { IBook } from '../../shared/types/book'
import type { INotification, INotificationList } from '../../shared/types/share'
import { addMemberApi, createBookApi, openFamily, profileApi, uploadAudio } from './family-helpers'
import type { IFamilyApi } from './family-helpers'
import { chooseProfile, signIn } from './helpers'

interface IFixture {
    family: IFamilyApi
    mamie: APIRequestContext
    lova: APIRequestContext
    mamieId: string
    bookId: string
    lineIds: string[]
}

const takeStatus = async (api: APIRequestContext, bookId: string, lineId: string, language: string): Promise<string | undefined> => {
    const book = (await (await api.get(`/api/books/${bookId}`)).json()) as IBook
    return book.recordings.find(item => item.lineId === lineId && item.language === language)?.status
}

const record = async (api: APIRequestContext, bookId: string, lineId: string, language: string): Promise<void> => {
    const response = await api.put(`/api/books/${bookId}/lines/${lineId}/audio`, { data: { fileId: await uploadAudio(api), ms: 600, language } })
    expect(response.status(), await response.text()).toBe(200)
}

const staleNotices = async (api: APIRequestContext, bookId: string): Promise<INotification[]> => {
    const list = (await (await api.get('/api/notifications')).json()) as INotificationList
    return list.items.filter(item => item.kind === 'stale_takes' && item.payload.bookId === bookId)
}

const setup = async (playwright: Playwright, baseURL: string | undefined, label: string): Promise<IFixture> => {
    const family = await openFamily(playwright, baseURL, label)
    const mamieId = await addMemberApi(family.parent, 'Mamie', 'relative')
    await addMemberApi(family.parent, 'Lova', 'child')
    const book = await createBookApi(family.parent, `Livre ${label}`, ['Il était une fois.', 'Le loup arriva.'])
    const everyone = (await (await family.parent.get('/api/members')).json()) as { id: string; role: string }[]
    const parentId = everyone.find(member => member.role === 'parent')!.id
    const langs = await family.parent.patch(`/api/members/${parentId}/settings`, { data: { spokenLanguages: ['fr', 'en'] } })
    expect(langs.ok(), await langs.text()).toBeTruthy()
    const patched = await family.parent.patch(`/api/books/${book.id}`, {
        data: { voiceLanguages: ['fr', 'en'], lines: book.lineIds.map(id => ({ id, memberId: mamieId })) },
    })
    expect(patched.ok(), await patched.text()).toBeTruthy()
    const mamie = await profileApi(playwright, baseURL, family.account, 'Mamie')
    const lova = await profileApi(playwright, baseURL, family.account, 'Lova')
    return { family, mamie, lova, mamieId, bookId: book.id, lineIds: book.lineIds }
}

const translate = (api: APIRequestContext, bookId: string, lineId: string, text: string, tone = '') =>
    api.put(`/api/books/${bookId}/lines/${lineId}/translations/en`, { data: { text, tone } })

test.describe('stale takes across languages', () => {
    test('editing a line text stales every language take and notifies the voice once', async ({ playwright, baseURL }) => {
        const { family, mamie, bookId, lineIds } = await setup(playwright, baseURL, 'stale-text')
        for (const lineId of lineIds) {
            await record(mamie, bookId, lineId, 'fr')
        }
        await record(mamie, bookId, lineIds[0]!, 'en')
        expect(await takeStatus(family.parent, bookId, lineIds[0]!, 'fr')).toBe('draft')

        const edited = await family.parent.patch(`/api/books/${bookId}`, { data: { lines: [{ id: lineIds[0], text: 'Il était deux fois.' }] } })
        expect(edited.ok(), await edited.text()).toBeTruthy()
        expect(await takeStatus(family.parent, bookId, lineIds[0]!, 'fr')).toBe('stale')
        expect(await takeStatus(family.parent, bookId, lineIds[0]!, 'en')).toBe('stale')
        expect(await takeStatus(family.parent, bookId, lineIds[1]!, 'fr')).toBe('draft')

        let notices = await staleNotices(mamie, bookId)
        expect(notices).toHaveLength(1)
        expect(notices[0]).toMatchObject({ count: 2, isRead: false })

        await family.parent.patch(`/api/books/${bookId}`, { data: { lines: [{ id: lineIds[1], text: 'Le loup repartit.' }] } })
        notices = await staleNotices(mamie, bookId)
        expect(notices).toHaveLength(1)
        expect(notices[0]!.count).toBe(3)
        expect(await staleNotices(family.parent, bookId)).toHaveLength(0)
    })

    test('a translation edit only stales its own language', async ({ playwright, baseURL }) => {
        const { family, mamie, bookId, lineIds } = await setup(playwright, baseURL, 'stale-translation')
        expect((await translate(family.parent, bookId, lineIds[0]!, 'Once upon a time.')).ok()).toBeTruthy()
        await record(mamie, bookId, lineIds[0]!, 'fr')
        await record(mamie, bookId, lineIds[0]!, 'en')
        expect((await translate(family.parent, bookId, lineIds[0]!, 'Once upon a time.')).ok()).toBeTruthy()
        expect(await takeStatus(family.parent, bookId, lineIds[0]!, 'en')).toBe('draft')
        expect((await translate(family.parent, bookId, lineIds[0]!, 'Once there was a time.')).ok()).toBeTruthy()
        expect(await takeStatus(family.parent, bookId, lineIds[0]!, 'en')).toBe('stale')
        expect(await takeStatus(family.parent, bookId, lineIds[0]!, 'fr')).toBe('draft')
    })

    test('a tone change stales the takes, a scene description or a note does not', async ({ playwright, baseURL }) => {
        const { family, mamie, bookId, lineIds } = await setup(playwright, baseURL, 'stale-tone')
        await record(mamie, bookId, lineIds[0]!, 'fr')
        await record(mamie, bookId, lineIds[1]!, 'fr')
        await family.parent.patch(`/api/books/${bookId}`, { data: { lines: [{ id: lineIds[0], sceneDescription: 'Une forêt la nuit', note: 'Doucement' }] } })
        expect(await takeStatus(family.parent, bookId, lineIds[0]!, 'fr')).toBe('draft')
        expect(await staleNotices(mamie, bookId)).toHaveLength(0)
        await family.parent.patch(`/api/books/${bookId}`, { data: { lines: [{ id: lineIds[1], tone: 'murmuré' }] } })
        expect(await takeStatus(family.parent, bookId, lineIds[1]!, 'fr')).toBe('stale')
        expect(await takeStatus(family.parent, bookId, lineIds[0]!, 'fr')).toBe('draft')
        expect(await staleNotices(mamie, bookId)).toHaveLength(1)
    })
})

test.describe('a redo request on a validated book', () => {
    test('keeps the book visible to the child while the line waits for a new take', async ({ playwright, baseURL }) => {
        const { family, mamie, lova, bookId, lineIds } = await setup(playwright, baseURL, 'redo-ready')
        for (const lineId of lineIds) {
            await record(mamie, bookId, lineId, 'fr')
        }
        await mamie.post(`/api/books/${bookId}/submit`, { data: {} })
        const validated = await family.parent.post(`/api/books/${bookId}/validate-all`, { data: {} })
        expect(validated.ok(), await validated.text()).toBeTruthy()
        const isListed = async (): Promise<boolean> => ((await (await lova.get('/api/books')).json()) as { id: string }[]).some(item => item.id === bookId)
        expect(await isListed()).toBe(true)

        const redo = await family.parent.post(`/api/books/${bookId}/lines/${lineIds[0]}/review`, { data: { action: 'request_changes', comment: 'Plus doucement.' } })
        expect(redo.ok(), await redo.text()).toBeTruthy()
        const book = (await (await family.parent.get(`/api/books/${bookId}`)).json()) as IBook
        expect(book.status).toBe('ready')
        expect(book.recordings.find(item => item.lineId === lineIds[0])?.status).toBe('changes_requested')
        expect(await isListed()).toBe(true)

        await record(mamie, bookId, lineIds[0]!, 'fr')
        expect(await takeStatus(family.parent, bookId, lineIds[0]!, 'fr')).toBe('submitted')
        expect(await isListed()).toBe(true)
    })
})

test.describe('review screen', () => {
    test('the parent switches the review language and toggles the original text', async ({ page, playwright, baseURL }) => {
        const { family, mamie, bookId, lineIds } = await setup(playwright, baseURL, 'review-ui')
        expect((await translate(family.parent, bookId, lineIds[0]!, 'Once upon a time.')).ok()).toBeTruthy()
        await record(mamie, bookId, lineIds[0]!, 'fr')
        await record(mamie, bookId, lineIds[0]!, 'en')
        await mamie.post(`/api/books/${bookId}/submit`, { data: {} })

        await signIn(page.request, family.account)
        await chooseProfile(page, 'Parent')
        await page.goto(`/books/${bookId}/review`)
        await page.getByTestId('review-more-toggle').click()
        await expect(page.getByTestId('review-languages')).toBeVisible()
        await expect(page.getByTestId('review-line-text').first()).toHaveText('Il était une fois.')
        await expect(page.getByTestId('review-original-toggle')).toHaveCount(0)

        await page.getByTestId('review-language-en').click()
        await expect(page.getByTestId('review-line-text').first()).toHaveText('Once upon a time.')
        await page.getByTestId('review-original-toggle').click()
        await expect(page.getByTestId('review-original-text').first()).toContainText('Il était une fois.')
        await page.getByTestId('review-original-toggle').click()
        await expect(page.getByTestId('review-original-text')).toHaveCount(0)

        await page.getByTestId('review-language-fr').click()
        await expect(page.getByTestId('review-line-text').first()).toHaveText('Il était une fois.')
    })
})
