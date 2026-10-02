import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import type { IBook } from '../../shared/types/book'
import type { IPlaybackPlan } from '../../shared/types/playback'
import { addMemberApi, openFamily, profileApi, uploadAudio } from './family-helpers'
import type { IFamilyApi } from './family-helpers'
import { chooseProfile, PNG_PIXEL, signIn } from './helpers'

interface IMemberView {
    id: string
    name: string
    hasCode: boolean
    codeKind: string | null
    isCodeLocked?: boolean
    status: string
}

const uploadScan = async (api: APIRequestContext): Promise<string> => {
    const response = await api.post('/api/files', { data: PNG_PIXEL, headers: { 'content-type': 'image/png' } })
    expect(response.ok(), await response.text()).toBeTruthy()
    return ((await response.json()) as { id: string }).id
}

const getBook = async (api: APIRequestContext, bookId: string): Promise<IBook> => (await (await api.get(`/api/books/${bookId}`)).json()) as IBook

const getPlan = async (api: APIRequestContext, bookId: string): Promise<IPlaybackPlan> => (await (await api.get(`/api/books/${bookId}/playback`)).json()) as IPlaybackPlan

const putTake = async (api: APIRequestContext, bookId: string, lineId: string, fileId: string, language?: string): Promise<void> => {
    const response = await api.put(`/api/books/${bookId}/lines/${lineId}/audio`, { data: { fileId, ms: 300, language } })
    expect(response.status(), await response.text()).toBe(200)
}

test.describe('role security', () => {
    let family: IFamilyApi
    let other: IFamilyApi
    let mamie: APIRequestContext
    let tonton: APIRequestContext
    let lova: APIRequestContext
    let ids = { mamie: '', tonton: '', lova: '', parent: '' }
    let scanId = ''
    let bookId = ''
    let lineIds: string[] = []
    let firstTakeId = ''

    test.beforeAll(async ({ playwright, baseURL }) => {
        family = await openFamily(playwright, baseURL, 'role-security')
        other = await openFamily(playwright, baseURL, 'role-security-other')
        ids = {
            parent: ((await (await family.parent.get('/api/auth/me')).json()) as { memberId: string }).memberId,
            mamie: await addMemberApi(family.parent, 'Mamie', 'relative'),
            tonton: await addMemberApi(family.parent, 'Tonton', 'relative'),
            lova: await addMemberApi(family.parent, 'Lova', 'child'),
        }
        mamie = await profileApi(playwright, baseURL, family.account, 'Mamie')
        tonton = await profileApi(playwright, baseURL, family.account, 'Tonton')
        lova = await profileApi(playwright, baseURL, family.account, 'Lova')
        scanId = await uploadScan(family.parent)
        const created = await family.parent.post('/api/books', {
            data: {
                title: 'Livre sécurisé',
                kind: 'multi',
                imageDesc: '',
                pageFileIds: [scanId],
                lines: [0, 1].map(index => ({ pageIndex: 0, character: `Perso ${index}`, text: `Réplique ${index + 1}` })),
            },
        })
        expect(created.ok(), await created.text()).toBeTruthy()
        bookId = ((await created.json()) as { id: string }).id
        lineIds = (await getBook(family.parent, bookId)).lines.map(line => line.id)
        const patched = await family.parent.patch(`/api/books/${bookId}`, { data: { lines: lineIds.map(id => ({ id, memberId: ids.mamie })) } })
        expect(patched.ok(), await patched.text()).toBeTruthy()
        for (const lineId of lineIds) {
            await putTake(mamie, bookId, lineId, await uploadAudio(mamie))
        }
        const ready = await family.parent.patch(`/api/books/${bookId}`, { data: { status: 'ready' } })
        expect(ready.ok(), await ready.text()).toBeTruthy()
        firstTakeId = (await getBook(family.parent, bookId)).lines[0]!.audioFileId!
    })

    test.afterAll(async () => {
        await Promise.all([family.parent, other.parent, mamie, tonton, lova].map(api => api.dispose()))
    })

    test('a message needs a sender who is not a child and a child recipient', async () => {
        const send = async (api: APIRequestContext, to: string) =>
            api.post('/api/messages', { data: { toMemberId: to, fileId: await uploadAudio(api), mime: 'audio/wav', durationMs: 300 } })
        expect((await send(lova, ids.mamie)).status()).toBe(403)
        expect((await send(lova, ids.parent)).status()).toBe(403)
        expect((await send(lova, ids.tonton)).status()).toBe(403)
        expect((await send(mamie, ids.parent)).status()).toBe(400)
        expect((await send(mamie, ids.tonton)).status()).toBe(400)
        expect((await send(family.parent, ids.mamie)).status()).toBe(400)
        expect((await send(tonton, ids.lova)).status()).toBe(200)
    })

    test('a relative gets the member list without code state', async () => {
        const asParent = (await (await family.parent.get('/api/members')).json()) as IMemberView[]
        expect(asParent.some(member => member.hasCode)).toBe(true)
        for (const api of [mamie]) {
            const members = (await (await api.get('/api/members')).json()) as IMemberView[]
            expect(members.length).toBe(asParent.length)
            for (const member of members) {
                expect(member.hasCode).toBe(false)
                expect(member.codeKind).toBeNull()
                expect(member.isCodeLocked).toBe(false)
                expect(member.status).toBe('active')
            }
        }
    })

    test('a relative cannot reach the family pages nor the family tab', async ({ page }) => {
        await signIn(page.request, family.account)
        await chooseProfile(page, 'Mamie')
        await expect(page).toHaveURL(/\/home/)
        await expect(page.locator('a[href="/family"]:visible')).toHaveCount(0)
        for (const path of ['/family', '/family/add', '/storage']) {
            await page.goto(path)
            await expect(page).toHaveURL(/\/home/)
        }
        await chooseProfile(page, 'Parent')
        await expect(page.locator('a[href="/family"]:visible')).toHaveCount(1)
        await page.goto('/family')
        await expect(page).toHaveURL(/\/family/)
    })

    test('a child never gets the scan, in the book payload nor through the file endpoint', async () => {
        const asChild = await getBook(lova, bookId)
        expect(asChild.pages.length).toBe(1)
        expect(asChild.pages.every(item => item.fileId === null)).toBe(true)
        expect((await getBook(family.parent, bookId)).pages[0]!.fileId).toBe(scanId)
        expect((await lova.get(`/api/files/${scanId}`)).status()).toBe(403)
        expect((await family.parent.get(`/api/files/${scanId}`)).status()).toBe(200)
        expect((await mamie.get(`/api/files/${scanId}`)).status()).toBe(200)
        expect((await tonton.get(`/api/files/${scanId}`)).status()).toBe(403)
        expect((await other.parent.get(`/api/files/${scanId}`)).status()).toBe(404)
    })

    test('a new take never replaces the approved one for the child until it is validated', async () => {
        const newTakeId = await uploadAudio(mamie)
        await putTake(mamie, bookId, lineIds[0]!, newTakeId)
        const newLanguageId = await uploadAudio(mamie)
        await putTake(mamie, bookId, lineIds[1]!, newLanguageId, 'mg')
        const parentView = await getBook(family.parent, bookId)
        expect(parentView.recordings.map(item => item.fileId)).toContain(newTakeId)
        expect(parentView.recordings.map(item => item.fileId)).toContain(newLanguageId)

        const childBook = await getBook(lova, bookId)
        expect(childBook.lines[0]!.audioFileId).toBe(firstTakeId)
        expect(childBook.recordings.map(item => item.fileId)).not.toContain(newTakeId)
        expect(childBook.recordings.map(item => item.fileId)).not.toContain(newLanguageId)
        const plan = await getPlan(lova, bookId)
        expect(plan.available.map(item => item.code)).toEqual([plan.bookLanguage])
        expect(plan.steps.map(step => step.fileId)).toContain(firstTakeId)
        expect(plan.steps.map(step => step.fileId)).not.toContain(newTakeId)
        expect((await lova.get(`/api/files/${firstTakeId}`)).status()).toBe(200)
        expect((await lova.get(`/api/files/${newTakeId}`)).status()).toBe(403)
        expect((await lova.get(`/api/files/${newLanguageId}`)).status()).toBe(403)
        expect((await getPlan(family.parent, bookId)).available.length).toBe(2)

        const approved = await family.parent.post(`/api/books/${bookId}/lines/${lineIds[0]}/review`, { data: { action: 'approve' } })
        expect(approved.status(), await approved.text()).toBe(200)
        const after = await getPlan(lova, bookId)
        expect(after.steps.map(step => step.fileId)).toContain(newTakeId)
        expect(after.steps.map(step => step.fileId)).not.toContain(firstTakeId)
        expect((await lova.get(`/api/files/${newTakeId}`)).status()).toBe(200)
        expect((await lova.get(`/api/files/${newLanguageId}`)).status()).toBe(403)
    })

    test('recording again while a take is pending keeps the approved take playable', async () => {
        const approvedId = (await getBook(lova, bookId)).lines[0]!.audioFileId!
        const firstDraft = await uploadAudio(mamie)
        const secondDraft = await uploadAudio(mamie)
        await putTake(mamie, bookId, lineIds[0]!, firstDraft)
        await putTake(mamie, bookId, lineIds[0]!, secondDraft)
        const plan = await getPlan(lova, bookId)
        expect(plan.steps.map(step => step.fileId)).toContain(approvedId)
        expect(plan.steps.map(step => step.fileId)).not.toContain(secondDraft)
        expect((await lova.get(`/api/files/${approvedId}`)).status()).toBe(200)
        expect((await lova.get(`/api/files/${secondDraft}`)).status()).toBe(403)
        expect((await getBook(family.parent, bookId)).recordings.map(item => item.fileId)).toContain(secondDraft)
    })
})
