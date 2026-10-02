import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { fakeAudioBytes, makeWav, PNG_PIXEL, PROFILE_PIN, signIn, uniqueAccount, useProfile } from './helpers'

interface IIdName {
    id: string
}

interface IBookDetail {
    lines: { id: string }[]
    recordings: { memberId: string }[]
}

interface IRoleFixture {
    parent: APIRequestContext
    mamie: APIRequestContext
    tonton: APIRequestContext
    lova: APIRequestContext
    ids: { mamie: string; tonton: string; lova: string }
    readyBookId: string
    draftBookId: string
    readyLineIds: string[]
    draftLineId: string
    messageId: string
    messageFileId: string
}

const upload = async (api: APIRequestContext, mime = 'audio/wav'): Promise<string> => {
    const response = await api.post('/api/files', { data: makeWav(300), headers: { 'content-type': mime } })
    expect(response.ok()).toBeTruthy()
    return ((await response.json()) as IIdName).id
}

const createBook = async (api: APIRequestContext, title: string, texts: string[]): Promise<{ id: string; lineIds: string[] }> => {
    const created = await api.post('/api/books', {
        data: {
            title,
            kind: 'multi',
            imageDesc: '',
            pageFileIds: [],
            lines: texts.map((text, index) => ({ pageIndex: 0, character: `Perso ${index}`, text })),
        },
    })
    expect(created.ok()).toBeTruthy()
    const { id } = (await created.json()) as IIdName
    const detail = (await (await api.get(`/api/books/${id}`)).json()) as IBookDetail
    return { id, lineIds: detail.lines.map(line => line.id) }
}

const asProfile = async (playwright: { request: { newContext: (options: { baseURL?: string }) => Promise<APIRequestContext> } }, baseURL: string | undefined, account: ReturnType<typeof uniqueAccount>, name: string): Promise<APIRequestContext> => {
    const api = await playwright.request.newContext({ baseURL })
    await signIn(api, account)
    await useProfile(api, name)
    return api
}

test.describe('roles and permissions', () => {
    let fixture: IRoleFixture

    test.beforeAll(async ({ playwright, baseURL }) => {
        const account = uniqueAccount('roles')
        const parent = await asProfile(playwright, baseURL, account, 'Parent')
        const ids = { mamie: '', tonton: '', lova: '' }
        for (const [key, name, role] of [
            ['mamie', 'Mamie', 'relative'],
            ['tonton', 'Tonton', 'relative'],
            ['lova', 'Lova', 'child'],
        ] as const) {
            const response = await parent.post('/api/members', { data: { name, role, color: 'coral', code: { kind: 'pin', value: PROFILE_PIN } } })
            expect(response.status(), await response.text()).toBe(200)
            ids[key] = ((await response.json()) as IIdName).id
        }
        const ready = await createBook(parent, 'Livre prêt', ['Un', 'Deux'])
        await parent.patch(`/api/books/${ready.id}`, {
            data: { lines: [{ id: ready.lineIds[0], memberId: ids.mamie }, { id: ready.lineIds[1], memberId: ids.tonton }] },
        })
        for (const lineId of ready.lineIds) {
            const put = await parent.put(`/api/books/${ready.id}/lines/${lineId}/audio`, { data: { fileId: await upload(parent), ms: 300 } })
            expect(put.ok()).toBeTruthy()
        }
        await parent.patch(`/api/books/${ready.id}`, { data: { status: 'ready' } })
        const draft = await createBook(parent, 'Livre brouillon', ['Trois'])
        await parent.patch(`/api/books/${draft.id}`, { data: { lines: [{ id: draft.lineIds[0], memberId: ids.tonton }] } })
        const mamie = await asProfile(playwright, baseURL, account, 'Mamie')
        const tonton = await asProfile(playwright, baseURL, account, 'Tonton')
        const lova = await asProfile(playwright, baseURL, account, 'Lova')
        const messageFileId = await upload(mamie)
        const message = await mamie.post('/api/messages', { data: { toMemberId: ids.lova, fileId: messageFileId, mime: 'audio/wav', durationMs: 300 } })
        expect(message.ok()).toBeTruthy()
        fixture = {
            parent,
            mamie,
            tonton,
            lova,
            ids,
            readyBookId: ready.id,
            draftBookId: draft.id,
            readyLineIds: ready.lineIds,
            draftLineId: draft.lineIds[0]!,
            messageId: ((await message.json()) as IIdName).id,
            messageFileId,
        }
    })

    test.afterAll(async () => {
        await Promise.all([fixture.parent.dispose(), fixture.mamie.dispose(), fixture.tonton.dispose(), fixture.lova.dispose()])
    })

    test('child sees only ready books with recordings and cannot write anything', async () => {
        const { lova, readyBookId, draftBookId, readyLineIds, ids } = fixture
        const listed = (await (await lova.get('/api/books')).json()) as IIdName[]
        expect(listed.map(book => book.id)).toEqual([readyBookId])
        expect((await lova.get(`/api/books/${readyBookId}`)).status()).toBe(200)
        expect((await lova.get(`/api/books/${draftBookId}`)).status()).toBe(404)
        expect((await lova.post('/api/books', { data: { title: 'X', kind: 'multi', lines: [{ pageIndex: 0, text: 'a' }] } })).status()).toBe(403)
        expect((await lova.patch(`/api/books/${readyBookId}`, { data: { title: 'Hack' } })).status()).toBe(403)
        expect((await lova.delete(`/api/books/${readyBookId}`)).status()).toBe(403)
        expect((await lova.post(`/api/books/${readyBookId}/characters`, { data: { name: 'Zed' } })).status()).toBe(403)
        expect((await lova.put(`/api/books/${readyBookId}/lines/${readyLineIds[0]}/audio`, { data: { fileId: fixture.messageFileId } })).status()).toBe(403)
        expect((await lova.delete(`/api/books/${readyBookId}/lines/${readyLineIds[0]}/audio`)).status()).toBe(403)
        expect((await lova.put(`/api/books/${readyBookId}/lines/${readyLineIds[0]}/translations/en`, { data: { text: 'One' } })).status()).toBe(403)
        expect((await lova.post('/api/members', { data: { name: 'Intrus', role: 'parent', color: 'sun' } })).status()).toBe(403)
        expect((await lova.patch(`/api/members/${ids.mamie}`, { data: { name: 'Hack' } })).status()).toBe(403)
        expect((await lova.delete(`/api/members/${ids.mamie}`)).status()).toBe(403)
        expect((await lova.get('/api/feedback')).status()).toBe(403)
        expect((await lova.delete('/api/feedback/whatever')).status()).toBe(403)
        const image = await lova.post('/api/files', { data: PNG_PIXEL, headers: { 'content-type': 'image/png' } })
        expect(image.status()).toBe(403)
        expect((await lova.get('/api/members')).status()).toBe(200)
    })

    test('relative sees and records only assigned lines and cannot manage the family', async () => {
        const { mamie, tonton, readyBookId, draftBookId, readyLineIds, draftLineId, ids } = fixture
        const mamieBooks = (await (await mamie.get('/api/books')).json()) as IIdName[]
        expect(mamieBooks.map(book => book.id)).toEqual([readyBookId])
        const tontonBooks = (await (await tonton.get('/api/books')).json()) as IIdName[]
        expect(tontonBooks.map(book => book.id).sort()).toEqual([readyBookId, draftBookId].sort())
        expect((await mamie.get(`/api/books/${draftBookId}`)).status()).toBe(404)
        expect((await mamie.get(`/api/books/${readyBookId}`)).status()).toBe(200)
        const own = await mamie.put(`/api/books/${readyBookId}/lines/${readyLineIds[0]}/audio`, { data: { fileId: await upload(mamie), ms: 300 } })
        expect(own.status()).toBe(200)
        const foreign = await mamie.put(`/api/books/${readyBookId}/lines/${readyLineIds[1]}/audio`, { data: { fileId: await upload(mamie), ms: 300 } })
        expect(foreign.status()).toBe(403)
        expect((await mamie.delete(`/api/books/${readyBookId}/lines/${readyLineIds[1]}/audio`)).status()).toBe(403)
        expect((await mamie.put(`/api/books/${draftBookId}/lines/${draftLineId}/audio`, { data: { fileId: await upload(mamie) } })).status()).toBe(403)
        expect((await mamie.delete(`/api/books/${readyBookId}`)).status()).toBe(403)
        expect((await mamie.patch(`/api/books/${readyBookId}`, { data: { title: 'Hack' } })).status()).toBe(403)
        expect((await mamie.post('/api/books', { data: { title: 'X', kind: 'multi', lines: [{ pageIndex: 0, text: 'a' }] } })).status()).toBe(403)
        expect((await mamie.delete(`/api/members/${ids.tonton}`)).status()).toBe(403)
        expect((await mamie.patch(`/api/members/${ids.lova}`, { data: { status: 'blocked' } })).status()).toBe(403)
        expect((await mamie.get('/api/feedback')).status()).toBe(403)
        const image = await mamie.post('/api/files', { data: PNG_PIXEL, headers: { 'content-type': 'image/png' } })
        expect(image.status()).toBe(200)
        const solo = await mamie.post('/api/books', {
            data: { title: 'Mon histoire', kind: 'solo', soloMemberId: ids.mamie, imageDesc: '', pageFileIds: [], lines: [{ pageIndex: 0, text: 'Salut' }] },
        })
        expect(solo.status()).toBe(200)
        const soloId = ((await solo.json()) as IIdName).id
        expect((await mamie.patch(`/api/books/${soloId}`, { data: { title: 'Mon histoire 2' } })).status()).toBe(200)
        expect((await mamie.delete(`/api/books/${soloId}`)).status()).toBe(403)
        const foreignSolo = await mamie.post('/api/books', {
            data: { title: 'Pour Tonton', kind: 'solo', soloMemberId: ids.tonton, imageDesc: '', pageFileIds: [], lines: [{ pageIndex: 0, text: 'Salut' }] },
        })
        expect(foreignSolo.status()).toBe(403)
        expect((await tonton.patch(`/api/books/${soloId}`, { data: { title: 'Hack' } })).status()).toBe(403)
        expect((await mamie.post('/api/files', { data: fakeAudioBytes(), headers: { 'content-type': 'audio/webm' } })).status()).toBe(200)
        expect((await mamie.post('/api/feedback', { data: { mood: 'love', text: 'Super' } })).status()).toBe(200)
    })

    test('parent keeps full control of the family data', async () => {
        const { parent, readyBookId } = fixture
        expect((await parent.get('/api/books')).status()).toBe(200)
        expect((await parent.get(`/api/books/${readyBookId}`)).status()).toBe(200)
        expect((await parent.get('/api/feedback')).status()).toBe(200)
        const image = await parent.post('/api/files', { data: PNG_PIXEL, headers: { 'content-type': 'image/png' } })
        expect(image.status()).toBe(200)
    })

    test('message files follow sender, recipient and parent rules', async () => {
        const { parent, mamie, tonton, lova, messageId, messageFileId } = fixture
        expect((await tonton.get(`/api/files/${messageFileId}`)).status()).toBe(403)
        const tontonMessages = (await (await tonton.get('/api/messages')).json()) as IIdName[]
        expect(tontonMessages).toHaveLength(0)
        const lovaMessages = (await (await lova.get('/api/messages')).json()) as IIdName[]
        expect(lovaMessages.map(message => message.id)).toEqual([messageId])
        expect((await lova.get(`/api/files/${messageFileId}`)).status()).toBe(200)
        expect((await mamie.post(`/api/messages/${messageId}/listen`)).status()).toBe(404)
        expect((await parent.post(`/api/messages/${messageId}/listen`)).status()).toBe(404)
        expect((await tonton.post(`/api/messages/${messageId}/listen`)).status()).toBe(404)
        expect((await lova.post(`/api/messages/${messageId}/listen`)).status()).toBe(200)
        expect((await lova.get(`/api/files/${messageFileId}`)).status()).toBe(403)
        expect((await parent.get(`/api/files/${messageFileId}`)).status()).toBe(200)
        expect((await mamie.get(`/api/files/${messageFileId}`)).status()).toBe(200)
        const parentMessages = (await (await parent.get('/api/messages')).json()) as IIdName[]
        expect(parentMessages.map(message => message.id)).toContain(messageId)
    })

    test('messages cannot be impersonated or built on foreign files', async () => {
        const { lova, tonton, ids, messageFileId } = fixture
        const impersonated = await lova.post('/api/messages', {
            data: { fromMemberId: ids.mamie, toMemberId: ids.tonton, fileId: await upload(lova), mime: 'audio/wav', durationMs: 300 },
        })
        expect(impersonated.status()).toBe(403)
        const foreignFile = await tonton.post('/api/messages', { data: { toMemberId: ids.lova, fileId: messageFileId, mime: 'audio/wav', durationMs: 300 } })
        expect(foreignFile.status()).toBe(403)
        const own = await tonton.post('/api/messages', { data: { toMemberId: ids.lova, fileId: await upload(tonton), mime: 'audio/wav', durationMs: 300 } })
        expect(own.status()).toBe(200)
    })

    test('the parent blocks then removes a relative and keeps their history', async () => {
        const { parent, mamie, tonton, lova, ids, readyBookId } = fixture
        const mamieFileId = await upload(mamie)
        const lovaFileId = await upload(lova)
        expect((await parent.patch(`/api/members/${ids.lova}`, { data: { status: 'blocked' } })).status()).toBe(400)
        expect((await parent.patch(`/api/members/${ids.mamie}`, { data: { status: 'sleeping' } })).status()).toBe(400)
        const blocked = await parent.patch(`/api/members/${ids.mamie}`, { data: { status: 'blocked' } })
        expect(blocked.status()).toBe(200)
        expect(((await blocked.json()) as { status: string }).status).toBe('blocked')
        expect((await mamie.get('/api/books')).status()).toBe(403)
        expect((await parent.post('/api/auth/profile', { data: { memberId: ids.mamie, code: PROFILE_PIN } })).status()).toBe(404)
        expect((await mamie.post('/api/messages', { data: { toMemberId: ids.lova, fileId: mamieFileId, mime: 'audio/wav' } })).status()).toBe(403)
        expect((await lova.post('/api/messages', { data: { toMemberId: ids.mamie, fileId: lovaFileId, mime: 'audio/wav' } })).status()).toBe(403)
        expect((await parent.patch(`/api/members/${ids.mamie}`, { data: { status: 'deceased' } })).status()).toBe(200)
        expect((await parent.patch(`/api/members/${ids.mamie}`, { data: { status: 'active' } })).status()).toBe(200)
        expect((await mamie.get('/api/books')).status()).toBe(200)
        expect((await parent.delete(`/api/members/${ids.tonton}`)).status()).toBe(200)
        const members = (await (await parent.get('/api/members')).json()) as IIdName[]
        expect(members.map(member => member.id)).not.toContain(ids.tonton)
        expect((await tonton.get('/api/books')).status()).toBe(403)
        const detail = (await (await parent.get(`/api/books/${readyBookId}`)).json()) as IBookDetail
        expect(detail.recordings.map(recording => recording.memberId)).toContain(ids.tonton)
    })

    test('the last parent cannot be demoted', async () => {
        const { parent } = fixture
        const members = (await (await parent.get('/api/members')).json()) as { id: string; name: string }[]
        const self = members.find(member => member.name === 'Parent')!
        expect((await parent.patch(`/api/members/${self.id}`, { data: { role: 'child' } })).status()).toBe(400)
    })
})
