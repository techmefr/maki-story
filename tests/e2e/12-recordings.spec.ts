import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import type { IBook, ILineTranslation } from '../../shared/types/book'
import { makeWav, signIn, uniqueAccount, useProfile } from './helpers'

interface IFixture {
    bookId: string
    lineId: string
    otherLineId: string
}

const uploadAudio = async (api: APIRequestContext): Promise<string> => {
    const response = await api.post('/api/files', { data: makeWav(300), headers: { 'content-type': 'audio/wav' } })
    expect(response.ok()).toBeTruthy()
    return ((await response.json()) as { id: string }).id
}

const loadBook = async (api: APIRequestContext, id: string): Promise<IBook> => {
    return (await (await api.get(`/api/books/${id}`)).json()) as IBook
}

const record = async (api: APIRequestContext, fixture: IFixture, lineId: string, language?: string): Promise<void> => {
    const response = await api.put(`/api/books/${fixture.bookId}/lines/${lineId}/audio`, {
        data: { fileId: await uploadAudio(api), ms: 300, language },
    })
    expect(response.ok()).toBeTruthy()
}

test.describe('recordings, translations and stale state', () => {
    let api: APIRequestContext
    let parentId = ''

    const createFixture = async (): Promise<IFixture> => {
        const created = await api.post('/api/books', {
            data: {
                title: 'Enregistrements',
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
        const book = await loadBook(api, id)
        const patched = await api.patch(`/api/books/${id}`, {
            data: { lines: book.lines.map(line => ({ id: line.id, memberId: parentId })) },
        })
        expect(patched.ok()).toBeTruthy()
        return { bookId: id, lineId: book.lines[0]!.id, otherLineId: book.lines[1]!.id }
    }

    test.beforeAll(async ({ playwright, baseURL }) => {
        api = await playwright.request.newContext({ baseURL })
        await signIn(api, uniqueAccount('rec'))
        parentId = await useProfile(api, 'Parent')
    })

    test.afterAll(async () => {
        await api.dispose()
    })

    test('a recording is stored with its language and read back on the line', async () => {
        const fixture = await createFixture()
        await record(api, fixture, fixture.lineId)
        const book = await loadBook(api, fixture.bookId)
        expect(book.recordings).toHaveLength(1)
        expect(book.recordings[0]).toMatchObject({ lineId: fixture.lineId, memberId: parentId, language: 'fr', status: 'draft', mime: 'audio/wav', durationMs: 300 })
        expect(book.lines[0]).toMatchObject({ audioMs: 300, recordingStatus: 'draft' })
        expect(book.lines[0]!.audioFileId).toBe(book.recordings[0]!.fileId)
        expect(book.lines[1]!.audioFileId).toBeNull()
        const summaries = (await (await api.get('/api/books')).json()) as { id: string; recordedCount: number }[]
        expect(summaries.find(item => item.id === fixture.bookId)!.recordedCount).toBe(1)
    })

    test('recording again replaces the take and a language keeps its own take', async () => {
        const fixture = await createFixture()
        await record(api, fixture, fixture.lineId)
        const first = (await loadBook(api, fixture.bookId)).recordings[0]!
        await record(api, fixture, fixture.lineId)
        await record(api, fixture, fixture.lineId, 'mg')
        const book = await loadBook(api, fixture.bookId)
        expect(book.recordings.map(item => item.language).sort()).toEqual(['fr', 'mg'])
        expect(book.recordings.find(item => item.language === 'fr')!.fileId).not.toBe(first.fileId)
        expect(book.lines[0]!.audioFileId).toBe(book.recordings.find(item => item.language === 'fr')!.fileId)
        expect((await api.put(`/api/books/${fixture.bookId}/lines/${fixture.lineId}/audio`, { data: { fileId: await uploadAudio(api), language: '' } })).status()).toBe(400)
        expect((await api.delete(`/api/books/${fixture.bookId}/lines/${fixture.lineId}/audio?language=mg`)).ok()).toBeTruthy()
        expect((await loadBook(api, fixture.bookId)).recordings.map(item => item.language)).toEqual(['fr'])
        expect((await api.delete(`/api/books/${fixture.bookId}/lines/${fixture.lineId}/audio`)).ok()).toBeTruthy()
        const cleared = await loadBook(api, fixture.bookId)
        expect(cleared.recordings).toEqual([])
        expect(cleared.lines[0]).toMatchObject({ audioFileId: null, audioMs: 0, recordingStatus: null })
    })

    test('editing the text of a line marks its recording stale, an identical text does not', async () => {
        const fixture = await createFixture()
        await record(api, fixture, fixture.lineId)
        await record(api, fixture, fixture.otherLineId)
        const unchanged = await api.patch(`/api/books/${fixture.bookId}`, { data: { lines: [{ id: fixture.lineId, text: 'Il était une fois.' }] } })
        expect(unchanged.ok()).toBeTruthy()
        expect((await loadBook(api, fixture.bookId)).lines[0]!.recordingStatus).toBe('draft')
        const edited = await api.patch(`/api/books/${fixture.bookId}`, { data: { lines: [{ id: fixture.lineId, text: 'Il était deux fois.' }] } })
        const book = (await edited.json()) as IBook
        expect(book.lines[0]).toMatchObject({ text: 'Il était deux fois.', recordingStatus: 'stale' })
        expect(book.lines[0]!.audioFileId).not.toBeNull()
        expect(book.lines[1]!.recordingStatus).toBe('draft')
        const summaries = (await (await api.get('/api/books')).json()) as { id: string; recordedCount: number }[]
        expect(summaries.find(item => item.id === fixture.bookId)!.recordedCount).toBe(1)
        await record(api, fixture, fixture.lineId)
        expect((await loadBook(api, fixture.bookId)).lines[0]!.recordingStatus).toBe('draft')
    })

    test('editing the tone of a line marks its recording stale', async () => {
        const fixture = await createFixture()
        await record(api, fixture, fixture.lineId)
        const edited = await api.patch(`/api/books/${fixture.bookId}`, { data: { lines: [{ id: fixture.lineId, tone: 'chuchoté' }] } })
        expect(((await edited.json()) as IBook).lines[0]).toMatchObject({ tone: 'chuchoté', recordingStatus: 'stale' })
    })

    test('an empty text edit is refused and leaves the recording untouched', async () => {
        const fixture = await createFixture()
        await record(api, fixture, fixture.lineId)
        const refused = await api.patch(`/api/books/${fixture.bookId}`, { data: { lines: [{ id: fixture.lineId, text: '  ' }] } })
        expect(refused.status()).toBe(400)
        expect((await loadBook(api, fixture.bookId)).lines[0]).toMatchObject({ text: 'Il était une fois.', recordingStatus: 'draft' })
    })

    test('translations are stored per language and only stale the recording of that language', async () => {
        const fixture = await createFixture()
        await record(api, fixture, fixture.lineId)
        await record(api, fixture, fixture.lineId, 'mg')
        const created = await api.put(`/api/books/${fixture.bookId}/lines/${fixture.lineId}/translations/mg`, {
            data: { text: 'Fahiny ela', tone: 'doux' },
        })
        expect(created.ok()).toBeTruthy()
        expect((await created.json()) as ILineTranslation).toEqual({ lineId: fixture.lineId, language: 'mg', text: 'Fahiny ela', tone: 'doux' })
        const afterCreate = await loadBook(api, fixture.bookId)
        expect(afterCreate.recordings.every(item => item.status === 'draft')).toBe(true)
        const same = await api.put(`/api/books/${fixture.bookId}/lines/${fixture.lineId}/translations/mg`, { data: { text: 'Fahiny ela', tone: 'doux' } })
        expect(same.ok()).toBeTruthy()
        expect((await loadBook(api, fixture.bookId)).recordings.every(item => item.status === 'draft')).toBe(true)
        await api.put(`/api/books/${fixture.bookId}/lines/${fixture.lineId}/translations/mg`, { data: { text: 'Fahiny be', tone: 'doux' } })
        const book = await loadBook(api, fixture.bookId)
        expect(book.translations).toEqual([{ lineId: fixture.lineId, language: 'mg', text: 'Fahiny be', tone: 'doux' }])
        expect(book.recordings.find(item => item.language === 'mg')!.status).toBe('stale')
        expect(book.recordings.find(item => item.language === 'fr')!.status).toBe('draft')
        expect((await api.put(`/api/books/${fixture.bookId}/lines/${fixture.lineId}/translations/mg`, { data: { text: '' } })).status()).toBe(400)
        expect((await api.delete(`/api/books/${fixture.bookId}/lines/${fixture.lineId}/translations/mg`)).ok()).toBeTruthy()
        expect((await api.delete(`/api/books/${fixture.bookId}/lines/${fixture.lineId}/translations/mg`)).status()).toBe(404)
    })

    test('recording an uncast line is refused and recording belongs to the family', async ({ playwright, baseURL }) => {
        const created = await api.post('/api/books', {
            data: { title: 'Libre', kind: 'multi', imageDesc: '', pageFileIds: [], lines: [{ pageIndex: 0, character: '', text: 'x' }] },
        })
        const { id } = (await created.json()) as { id: string }
        const book = await loadBook(api, id)
        const uncast = await api.put(`/api/books/${id}/lines/${book.lines[0]!.id}/audio`, { data: { fileId: await uploadAudio(api), ms: 1 } })
        expect(uncast.status()).toBe(400)
        const other = await playwright.request.newContext({ baseURL })
        await signIn(other, uniqueAccount('rec-other'))
        await useProfile(other, 'Parent')
        const translated = await other.put(`/api/books/${id}/lines/${book.lines[0]!.id}/translations/mg`, { data: { text: 'x' } })
        expect(translated.status()).toBe(404)
        await other.dispose()
    })

    test('changing the voice of a line drops its recording', async () => {
        const fixture = await createFixture()
        await record(api, fixture, fixture.lineId)
        const relative = await api.post('/api/members', { data: { name: 'Mamie', role: 'relative', color: 'coral' } })
        const { id: relativeId } = (await relative.json()) as { id: string }
        const same = await api.patch(`/api/books/${fixture.bookId}`, { data: { lines: [{ id: fixture.lineId, memberId: parentId }] } })
        expect(((await same.json()) as IBook).recordings).toHaveLength(1)
        const moved = await api.patch(`/api/books/${fixture.bookId}`, { data: { lines: [{ id: fixture.lineId, memberId: relativeId }] } })
        const book = (await moved.json()) as IBook
        expect(book.recordings).toEqual([])
        expect(book.lines[0]).toMatchObject({ memberId: relativeId, audioFileId: null })
    })
})
