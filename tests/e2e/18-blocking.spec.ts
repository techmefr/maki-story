import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import type { IBook, IBookSummary } from '../../shared/types/book'
import type { IVoiceBook } from '../../shared/types/share'
import { addMemberApi, createBookApi, openFamily, profileApi, uploadAudio } from './family-helpers'
import type { IFamilyApi } from './family-helpers'

const childBooks = async (child: APIRequestContext): Promise<string[]> => {
    return ((await (await child.get('/api/books')).json()) as IBookSummary[]).map(book => book.id)
}

const summary = async (parent: APIRequestContext, id: string): Promise<IBookSummary> => {
    return ((await (await parent.get('/api/books')).json()) as IBookSummary[]).find(book => book.id === id)!
}

test.describe('blocking a relative voice', () => {
    test.describe.configure({ mode: 'serial' })

    let family: IFamilyApi
    let mamie: APIRequestContext
    let tonton: APIRequestContext
    let lova: APIRequestContext
    let ids = { mamie: '', tonton: '' }
    let book: { id: string; lineIds: string[] }

    const setMember = (id: string, data: object) => family.parent.patch(`/api/members/${id}`, { data })

    test.beforeAll(async ({ playwright, baseURL }) => {
        family = await openFamily(playwright, baseURL, 'blocking')
        ids = { mamie: await addMemberApi(family.parent, 'Mamie', 'relative'), tonton: await addMemberApi(family.parent, 'Tonton', 'relative') }
        await addMemberApi(family.parent, 'Lova', 'child')
        mamie = await profileApi(playwright, baseURL, family.account, 'Mamie')
        tonton = await profileApi(playwright, baseURL, family.account, 'Tonton')
        lova = await profileApi(playwright, baseURL, family.account, 'Lova')
        book = await createBookApi(family.parent, 'Livre à deux voix', ['Un', 'Deux', 'Trois'])
        await family.parent.patch(`/api/books/${book.id}`, {
            data: { lines: [{ id: book.lineIds[0], memberId: ids.mamie }, { id: book.lineIds[1], memberId: ids.tonton }, { id: book.lineIds[2], memberId: ids.mamie }] },
        })
        for (const [index, lineId] of book.lineIds.entries()) {
            const api = index === 1 ? tonton : mamie
            expect((await api.put(`/api/books/${book.id}/lines/${lineId}/audio`, { data: { fileId: await uploadAudio(api), ms: 300 } })).status()).toBe(200)
        }
        expect((await family.parent.patch(`/api/books/${book.id}`, { data: { status: 'ready' } })).ok()).toBeTruthy()
    })

    test.afterAll(async () => {
        await Promise.all([family.parent, mamie, tonton, lova].map(api => api.dispose()))
    })

    test('the child listens while nobody is blocked', async () => {
        expect(await childBooks(lova)).toContain(book.id)
        expect(await summary(family.parent, book.id)).toMatchObject({ isVoiceBlocked: false, blockedLineCount: 0 })
    })

    test('blocking a relative hides every book with their voice from children', async () => {
        expect((await setMember(ids.mamie, { status: 'blocked' })).status()).toBe(200)
        expect(await childBooks(lova)).not.toContain(book.id)
        expect((await lova.get(`/api/books/${book.id}`)).status()).toBe(404)
        const detail = (await (await family.parent.get(`/api/books/${book.id}`)).json()) as IBook
        const fileId = detail.recordings.find(recording => recording.memberId === ids.mamie)!.fileId
        expect((await lova.get(`/api/files/${fileId}`)).status()).toBe(403)
        expect(await summary(family.parent, book.id)).toMatchObject({ isVoiceBlocked: true, blockedLineCount: 2 })
        expect(detail.lines.filter(line => line.isVoiceBlocked)).toHaveLength(2)
        const impact = (await (await family.parent.get(`/api/members/${ids.mamie}/voice-books`)).json()) as IVoiceBook[]
        expect(impact).toEqual([{ id: book.id, title: 'Livre à deux voix', lineCount: 2 }])
        expect((await mamie.get('/api/auth/me')).status()).toBe(200)
        expect((await mamie.get('/api/books')).status()).toBe(403)
    })

    test('unblocking brings the book back', async () => {
        expect((await setMember(ids.mamie, { status: 'active' })).status()).toBe(200)
        expect(await childBooks(lova)).toContain(book.id)
        expect(await summary(family.parent, book.id)).toMatchObject({ isVoiceBlocked: false })
    })

    test('a relative who left or passed away is handled case by case', async () => {
        expect((await setMember(ids.mamie, { status: 'deceased' })).status()).toBe(200)
        expect(await childBooks(lova)).toContain(book.id)
        expect((await setMember(ids.mamie, { voicePolicy: 'block' })).status()).toBe(200)
        expect(await childBooks(lova)).not.toContain(book.id)
        expect((await setMember(ids.mamie, { voicePolicy: 'keep' })).status()).toBe(200)
        expect(await childBooks(lova)).toContain(book.id)
        expect((await setMember(ids.mamie, { status: 'left', voicePolicy: 'rerecord' })).status()).toBe(200)
        expect(await childBooks(lova)).not.toContain(book.id)
        const members = (await (await family.parent.get('/api/members')).json()) as { id: string; status: string; voicePolicy: string }[]
        expect(members.find(member => member.id === ids.mamie)).toMatchObject({ status: 'left', voicePolicy: 'rerecord' })
    })

    test('the book plays again once the lines are re-recorded by someone else', async () => {
        const [first, , third] = book.lineIds
        const parentId = ((await (await family.parent.get('/api/auth/me')).json()) as { memberId: string }).memberId
        expect((await family.parent.put(`/api/books/${book.id}/lines/${first}/audio`, { data: { fileId: await uploadAudio(family.parent), ms: 300 } })).status()).toBe(200)
        expect(await childBooks(lova)).not.toContain(book.id)
        expect(await summary(family.parent, book.id)).toMatchObject({ isVoiceBlocked: true, blockedLineCount: 1 })
        expect((await family.parent.put(`/api/books/${book.id}/lines/${third}/audio`, { data: { fileId: await uploadAudio(family.parent), ms: 300 } })).status()).toBe(200)
        expect(await childBooks(lova)).toContain(book.id)
        const detail = (await (await family.parent.get(`/api/books/${book.id}`)).json()) as IBook
        expect(detail.lines.filter(line => line.memberId === parentId)).toHaveLength(2)
        expect(detail.recordings.filter(recording => recording.memberId === ids.mamie)).toHaveLength(0)
    })

    test('the blocked relative cannot record again and only a parent decides', async () => {
        expect((await setMember(ids.tonton, { status: 'blocked' })).status()).toBe(200)
        expect((await tonton.put(`/api/books/${book.id}/lines/${book.lineIds[1]}/audio`, { data: { fileId: await uploadAudio(family.parent) } })).status()).toBe(403)
        expect((await lova.patch(`/api/members/${ids.tonton}`, { data: { status: 'active' } })).status()).toBe(403)
        expect((await mamie.patch(`/api/members/${ids.tonton}`, { data: { status: 'active' } })).status()).toBe(403)
        expect((await setMember(ids.tonton, { voicePolicy: 'nope' })).status()).toBe(400)
        const parentId = ((await (await family.parent.get('/api/auth/me')).json()) as { memberId: string }).memberId
        expect((await setMember(parentId, { voicePolicy: 'block' })).status()).toBe(400)
        expect((await lova.get(`/api/members/${ids.tonton}/voice-books`)).status()).toBe(403)
        expect(await childBooks(lova)).not.toContain(book.id)
        expect((await setMember(ids.tonton, { status: 'active' })).status()).toBe(200)
        expect(await childBooks(lova)).toContain(book.id)
    })
})
