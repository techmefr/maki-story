import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { chooseProfile, makeWav, PNG_PIXEL, PROFILE_PIN, signIn, uniqueAccount, useProfile } from './helpers'
import type { IE2eAccount } from './helpers'

test.describe.configure({ mode: 'serial' })

interface IIdName {
    id: string
}

interface IMessageRow {
    id: string
    fileId: string
    fromMemberId: string
    toMemberId: string
    createdAt: string
}

interface ISent {
    status: number
    body: string
    id: string
    fileId: string
}

const LIMIT = 3

test.describe('status messages', () => {
    let account: IE2eAccount
    let parent: APIRequestContext
    let mamie: APIRequestContext
    let tonton: APIRequestContext
    let lova: APIRequestContext
    const ids = { parent: '', mamie: '', tonton: '', lova: '' }

    const asProfile = async (
        playwright: { request: { newContext: (options: { baseURL?: string }) => Promise<APIRequestContext> } },
        baseURL: string | undefined,
        name: string,
    ): Promise<APIRequestContext> => {
        const api = await playwright.request.newContext({ baseURL })
        await signIn(api, account)
        await useProfile(api, name)
        return api
    }

    const send = async (api: APIRequestContext, toMemberId: string, durationMs = 300): Promise<ISent> => {
        const upload = await api.post('/api/files', { data: makeWav(300), headers: { 'content-type': 'audio/wav' } })
        const fileId = ((await upload.json()) as IIdName).id
        const response = await api.post('/api/messages', { data: { toMemberId, fileId, mime: 'audio/wav', durationMs } })
        const body = await response.text()
        return { status: response.status(), body, id: response.ok() ? (JSON.parse(body) as IIdName).id : '', fileId }
    }

    const messagesFrom = async (api: APIRequestContext, fromMemberId: string): Promise<IMessageRow[]> => {
        const all = (await (await api.get('/api/messages')).json()) as IMessageRow[]
        return all.filter(message => message.fromMemberId === fromMemberId).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    }

    test.beforeAll(async ({ playwright, baseURL }) => {
        account = uniqueAccount('status')
        parent = await playwright.request.newContext({ baseURL })
        await signIn(parent, account)
        await useProfile(parent, 'Parent')
        for (const [key, name, role] of [
            ['mamie', 'Mamie', 'relative'],
            ['tonton', 'Tonton', 'relative'],
            ['lova', 'Lova', 'child'],
        ] as const) {
            const response = await parent.post('/api/members', {
                data: { name, role, color: key === 'mamie' ? 'coral' : 'sky', code: { kind: 'pin', value: PROFILE_PIN } },
            })
            expect(response.ok(), await response.text()).toBeTruthy()
            ids[key] = ((await response.json()) as IIdName).id
        }
        const members = (await (await parent.get('/api/members')).json()) as (IIdName & { name: string })[]
        ids.parent = members.find(member => member.name === 'Parent')!.id
        mamie = await asProfile(playwright, baseURL, 'Mamie')
        tonton = await asProfile(playwright, baseURL, 'Tonton')
        lova = await asProfile(playwright, baseURL, 'Lova')
    })

    test.afterAll(async () => {
        await Promise.all([parent, mamie, tonton, lova].map(api => api.dispose()))
    })

    test('a relative can leave three unlistened messages and the fourth is refused', async () => {
        for (let i = 0; i < LIMIT; i++) {
            const sent = await send(mamie, ids.lova)
            expect(sent.status, sent.body).toBe(200)
        }
        const refused = await send(mamie, ids.lova)
        expect(refused.status).toBe(409)
        expect(refused.body).toContain('3 messages en attente')
        const independent = await send(tonton, ids.lova)
        expect(independent.status, independent.body).toBe(200)
    })

    test('only a real recorded voice is accepted', async () => {
        const image = await tonton.post('/api/files', { data: PNG_PIXEL, headers: { 'content-type': 'image/png' } })
        const imageId = ((await image.json()) as IIdName).id
        const asImage = await tonton.post('/api/messages', { data: { toMemberId: ids.mamie, fileId: imageId, mime: 'image/png', durationMs: 300 } })
        expect(asImage.status()).toBe(400)
        const silent = await send(tonton, ids.mamie, 0)
        expect(silent.status).toBe(400)
    })

    test('the child must listen in order and never gets a file twice', async () => {
        expect((await send(tonton, ids.lova)).status).toBe(200)
        expect((await send(tonton, ids.lova)).status).toBe(200)
        const [first, second] = await messagesFrom(lova, ids.tonton)
        expect((await lova.get(`/api/files/${second!.fileId}`)).status()).toBe(403)
        expect((await lova.get(`/api/files/${first!.fileId}`)).status()).toBe(200)
        expect((await lova.post(`/api/messages/${second!.id}/listen`)).status()).toBe(409)
        expect((await lova.post(`/api/messages/${first!.id}/listen`)).status()).toBe(200)
        expect((await lova.get(`/api/files/${first!.fileId}`)).status()).toBe(403)
        expect((await lova.get(`/api/files/${second!.fileId}`)).status()).toBe(200)
        expect((await parent.get(`/api/files/${first!.fileId}`)).status()).toBe(200)
        expect((await parent.post(`/api/messages/${first!.id}/listen`)).status()).toBe(404)
    })

    test('the child sees a counter bubble and plays each message to the end in turn', async ({ page }) => {
        await signIn(page.request, account)
        await chooseProfile(page, 'Lova')
        await page.goto('/kid')
        const mamieFace = page.locator('.face', { hasText: 'Mamie' })
        await expect(mamieFace.locator('[data-bubble-count]')).toHaveText('3')
        await expect(page.locator('.face', { hasText: 'Tonton' }).locator('[data-bubble-count]')).toHaveText('2')
        await mamieFace.locator('.face__bubble').click()
        for (const next of ['Message suivant (2 en attente)', 'Message suivant']) {
            await page.getByRole('button', { name: 'Écouter' }).click()
            await expect(page.getByRole('link', { name: next })).toBeVisible({ timeout: 15000 })
            await page.getByRole('link', { name: next }).click()
        }
        await page.getByRole('button', { name: 'Écouter' }).click()
        await expect(page.getByRole('link', { name: 'Répondre' })).toBeVisible({ timeout: 15000 })
        await expect(page.getByRole('link', { name: /Message suivant/ })).toHaveCount(0)
        await page.reload()
        await expect(page.getByText('Ce message a déjà été écouté')).toBeVisible()
    })

    test('a relative can send again once the earlier messages were listened to', async () => {
        const sent = await send(mamie, ids.lova)
        expect(sent.status, sent.body).toBe(200)
    })

    test('the status strip is pinned on top of the library on a tablet', async ({ page }) => {
        await page.setViewportSize({ width: 1180, height: 820 })
        await signIn(page.request, account)
        await chooseProfile(page, 'Lova')
        await page.goto('/kid/library')
        const strip = page.getByRole('navigation', { name: 'Messages de la famille' })
        await expect(strip).toBeVisible()
        await expect(strip.getByRole('link')).toHaveCount(2)
        await expect(strip.getByRole('link', { name: /Tonton/ })).toBeVisible()
        await expect(strip).toHaveCSS('position', 'sticky')
        await page.setViewportSize({ width: 390, height: 800 })
        await expect(strip).toBeHidden()
    })

    test('a parent can replay a message that was already listened to', async ({ page }) => {
        const sent = await send(lova, ids.parent)
        expect(sent.status, sent.body).toBe(200)
        expect((await parent.post(`/api/messages/${sent.id}/listen`)).status()).toBe(200)
        expect((await parent.get(`/api/files/${sent.fileId}`)).status()).toBe(200)
        await signIn(page.request, account)
        await chooseProfile(page, 'Parent')
        await page.goto(`/message/listen/${sent.id}`)
        await page.getByRole('button', { name: 'Écouter' }).click()
        await expect(page.getByRole('link', { name: 'Répondre' })).toBeVisible({ timeout: 15000 })
    })
})
