import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { makeWav, signIn, uniqueAccount, useProfile } from './helpers'

interface IIdName {
    id: string
    name: string
}

interface IFamilyFixture {
    api: APIRequestContext
    parentId: string
    relativeId: string
    childId: string
    bookId: string
    lineId: string
    fileId: string
    messageId: string
}

const createFamily = async (api: APIRequestContext): Promise<IFamilyFixture> => {
    const parentId = await useProfile(api, 'Parent')
    const relative = await api.post('/api/members', { data: { name: 'Mamie', role: 'relative', color: 'coral' } })
    expect(relative.ok()).toBeTruthy()
    const relativeId = ((await relative.json()) as IIdName).id
    const child = await api.post('/api/members', { data: { name: 'Lova', role: 'child', color: 'sky' } })
    expect(child.ok()).toBeTruthy()
    const childId = ((await child.json()) as IIdName).id
    const upload = await api.post('/api/files', { data: makeWav(300), headers: { 'content-type': 'audio/wav' } })
    const fileId = ((await upload.json()) as { id: string }).id
    const book = await api.post('/api/books', {
        data: { title: 'Livre privé', kind: 'multi', imageDesc: '', pageFileIds: [], lines: [{ pageIndex: 0, character: 'Narrateur', text: 'Secret' }] },
    })
    const bookId = ((await book.json()) as { id: string }).id
    const detail = (await (await api.get(`/api/books/${bookId}`)).json()) as { lines: { id: string }[] }
    const message = await api.post('/api/messages', {
        data: { toMemberId: childId, fileId, mime: 'audio/wav', durationMs: 300 },
    })
    expect(message.ok()).toBeTruthy()
    const messageId = ((await message.json()) as { id: string }).id
    return { api, parentId, relativeId, childId, bookId, lineId: detail.lines[0]!.id, fileId, messageId }
}

test.describe('family isolation', () => {
    let first: IFamilyFixture
    let second: IFamilyFixture

    test.beforeAll(async ({ playwright, baseURL }) => {
        const firstApi = await playwright.request.newContext({ baseURL })
        await signIn(firstApi, uniqueAccount('iso-a'))
        first = await createFamily(firstApi)
        const secondApi = await playwright.request.newContext({ baseURL })
        await signIn(secondApi, uniqueAccount('iso-b'))
        second = await createFamily(secondApi)
    })

    test.afterAll(async () => {
        await first.api.dispose()
        await second.api.dispose()
    })

    test('two accounts do not see each other books and members', async () => {
        const books = (await (await second.api.get('/api/books')).json()) as { id: string }[]
        expect(books.map(book => book.id)).toEqual([second.bookId])
        const members = (await (await second.api.get('/api/members')).json()) as IIdName[]
        expect(members.map(member => member.id)).not.toContain(first.parentId)
        expect(members.map(member => member.id)).not.toContain(first.relativeId)
        expect(members).toHaveLength(3)
        expect((await second.api.get(`/api/books/${first.bookId}`)).status()).toBe(404)
        expect((await second.api.patch(`/api/books/${first.bookId}`, { data: { title: 'Piraté' } })).status()).toBe(404)
        expect((await second.api.delete(`/api/books/${first.bookId}`)).status()).toBe(404)
        expect((await second.api.patch(`/api/members/${first.relativeId}`, { data: { name: 'Piraté' } })).status()).toBe(404)
        expect((await second.api.delete(`/api/members/${first.relativeId}`)).status()).toBe(404)
        expect((await first.api.get(`/api/books/${first.bookId}`)).status()).toBe(200)
    })

    test('two accounts do not see each other files', async () => {
        expect((await second.api.get(`/api/files/${first.fileId}`)).status()).toBe(404)
        expect((await first.api.get(`/api/files/${first.fileId}`)).status()).toBe(200)
        const put = await second.api.put(`/api/books/${second.bookId}/lines/${second.lineId}/audio`, { data: { fileId: first.fileId, ms: 1 } })
        expect(put.status()).toBe(400)
        const cross = await second.api.put(`/api/books/${first.bookId}/lines/${first.lineId}/audio`, { data: { fileId: second.fileId, ms: 1 } })
        expect(cross.status()).toBe(404)
        const stolen = await second.api.post('/api/books', {
            data: { title: 'Vol', kind: 'multi', imageDesc: '', pageFileIds: [first.fileId], lines: [{ pageIndex: 0, character: '', text: 'x' }] },
        })
        expect(stolen.status()).toBe(400)
    })

    test('two accounts do not see each other messages', async () => {
        const messages = (await (await second.api.get('/api/messages')).json()) as { id: string }[]
        expect(messages.map(message => message.id)).toEqual([second.messageId])
        expect((await second.api.post(`/api/messages/${first.messageId}/listen`)).status()).toBe(404)
        const toForeign = await second.api.post('/api/messages', {
            data: { toMemberId: first.relativeId, fileId: second.fileId, mime: 'audio/wav', durationMs: 1 },
        })
        expect(toForeign.status()).toBe(400)
    })

    test('a profile of another family cannot be selected', async () => {
        const response = await second.api.post('/api/auth/profile', { data: { memberId: first.parentId } })
        expect(response.status()).toBe(404)
    })

    test('the sender comes from the session, never from the body', async () => {
        const spoof = await first.api.post('/api/messages', {
            data: { fromMemberId: first.relativeId, toMemberId: first.parentId, fileId: first.fileId, mime: 'audio/wav', durationMs: 1 },
        })
        expect(spoof.status()).toBe(403)
        const honest = await first.api.post('/api/messages', {
            data: { fromMemberId: first.parentId, toMemberId: first.childId, fileId: first.fileId, mime: 'audio/wav', durationMs: 1 },
        })
        expect(honest.ok()).toBeTruthy()
        const message = (await honest.json()) as { fromMemberId: string }
        expect(message.fromMemberId).toBe(first.parentId)
    })

    test('sending a message needs a chosen profile', async ({ playwright, baseURL }) => {
        const api = await playwright.request.newContext({ baseURL })
        await signIn(api, uniqueAccount('iso-noprofile'))
        const members = (await (await api.get('/api/members')).json()) as IIdName[]
        const upload = await api.post('/api/files', { data: makeWav(300), headers: { 'content-type': 'audio/wav' } })
        const fileId = ((await upload.json()) as { id: string }).id
        const response = await api.post('/api/messages', {
            data: { fromMemberId: members[0]!.id, toMemberId: 'someone', fileId, mime: 'audio/wav', durationMs: 1 },
        })
        expect(response.status()).toBe(403)
        await api.dispose()
    })

    test('an anonymous visitor cannot read a file', async ({ playwright, baseURL }) => {
        const anonymous = await playwright.request.newContext({ baseURL })
        expect((await anonymous.get(`/api/files/${first.fileId}`)).status()).toBe(401)
        await anonymous.dispose()
    })
})
