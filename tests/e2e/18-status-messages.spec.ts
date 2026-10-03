import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import postgres from 'postgres'
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
    kind: string
    status: string
    firstListenedAt: string | null
    expiresAt: string | null
    createdAt: string
}

interface ISent {
    status: number
    body: string
    id: string
    fileId: string
}

const DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgresql://tantara@localhost:5544/tantara_e2e'
const DAY_MS = 24 * 60 * 60 * 1000
const MAX_MESSAGE_MS = 120000

test.describe('voice message rules v3', () => {
    let account: IE2eAccount
    let parent: APIRequestContext
    let mamie: APIRequestContext
    let tonton: APIRequestContext
    let lova: APIRequestContext
    const ids = { parent: '', mamie: '', tonton: '', lova: '' }
    let first: ISent

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

    const send = async (api: APIRequestContext, toMemberId: string, extra: Record<string, unknown> = {}, durationMs = 300): Promise<ISent> => {
        const upload = await api.post('/api/files', { data: makeWav(300), headers: { 'content-type': 'audio/wav' } })
        const fileId = ((await upload.json()) as IIdName).id
        const response = await api.post('/api/messages', { data: { toMemberId, fileId, mime: 'audio/wav', durationMs, ...extra } })
        const body = await response.text()
        return { status: response.status(), body, id: response.ok() ? (JSON.parse(body) as IIdName).id : '', fileId }
    }

    const messageById = async (api: APIRequestContext, id: string): Promise<IMessageRow | undefined> => {
        const all = (await (await api.get('/api/messages')).json()) as IMessageRow[]
        return all.find(message => message.id === id)
    }

    const sql = async <T>(run: (db: postgres.Sql) => Promise<T>): Promise<T> => {
        const db = postgres(DATABASE_URL, { max: 1, onnotice: () => undefined })
        try {
            return await run(db)
        } finally {
            await db.end()
        }
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

    test('a sender has five active messages per recipient and the sixth is refused with the reason', async () => {
        first = await send(mamie, ids.lova)
        expect(first.status, first.body).toBe(200)
        for (let count = 1; count < 5; count++) {
            expect((await send(mamie, ids.lova)).status).toBe(200)
        }
        const refused = await send(mamie, ids.lova)
        expect(refused.status).toBe(409)
        expect(refused.body).toContain('5 messages en attente')
        expect((await send(tonton, ids.lova)).status).toBe(200)
    })

    test('a message goes to exactly one child, is a real voice and stays under two minutes', async () => {
        expect((await send(tonton, ids.mamie)).status).toBe(400)
        expect((await send(lova, ids.lova)).status).toBe(400)
        expect((await send(lova, ids.mamie)).status).toBe(200)
        const image = await tonton.post('/api/files', { data: PNG_PIXEL, headers: { 'content-type': 'image/png' } })
        const imageId = ((await image.json()) as IIdName).id
        const asImage = await tonton.post('/api/messages', { data: { toMemberId: ids.lova, fileId: imageId, mime: 'image/png', durationMs: 300 } })
        expect(asImage.status()).toBe(400)
        expect((await send(tonton, ids.lova, {}, 0)).status).toBe(400)
        expect((await send(tonton, ids.lova, {}, MAX_MESSAGE_MS + 1)).status).toBe(400)
    })

    test('only the child listen starts the 24 hour countdown and replays never restart it', async () => {
        expect((await mamie.post(`/api/messages/${first.id}/listen`)).status()).toBe(200)
        expect((await parent.post(`/api/messages/${first.id}/listen`)).status()).toBe(200)
        expect((await tonton.post(`/api/messages/${first.id}/listen`)).status()).toBe(404)
        let row = await messageById(lova, first.id)
        expect(row).toMatchObject({ firstListenedAt: null, expiresAt: null })
        expect((await lova.post(`/api/messages/${first.id}/listen`)).status()).toBe(200)
        row = await messageById(lova, first.id)
        expect(row!.firstListenedAt).not.toBeNull()
        const expectedExpiry = new Date(row!.firstListenedAt!).getTime() + DAY_MS
        expect(Math.abs(new Date(row!.expiresAt!).getTime() - expectedExpiry)).toBeLessThan(2000)
        const firstExpiry = row!.expiresAt
        expect((await lova.post(`/api/messages/${first.id}/listen`)).status()).toBe(200)
        expect((await lova.get(`/api/files/${first.fileId}`)).status()).toBe(200)
        expect((await messageById(lova, first.id))!.expiresAt).toBe(firstExpiry)
        expect((await mamie.post(`/api/messages/${first.id}/listen`)).status()).toBe(200)
        expect((await messageById(lova, first.id))!.expiresAt).toBe(firstExpiry)
    })

    test('an expired message is refused server side, purged with its audio and frees the slot', async () => {
        await sql(db => db`update messages set expires_at = now() - interval '1 minute' where id = ${first.id}`)
        expect((await lova.post(`/api/messages/${first.id}/listen`)).status()).toBe(410)
        expect([403, 404]).toContain((await lova.get(`/api/files/${first.fileId}`)).status())
        expect(await messageById(lova, first.id)).toBeUndefined()
        const [file] = await sql(db => db`select count(*)::int as total from files where id = ${first.fileId}`)
        expect(file!.total).toBe(0)
        const [row] = await sql(db => db`select status from messages where id = ${first.id}`)
        expect(row!.status).toBe('EXPIRED')
        const again = await send(mamie, ids.lova)
        expect(again.status, again.body).toBe(200)
    })

    test('the scheduled purge task expires due messages and keeps the never listened ones', async ({ request }) => {
        const never = await send(tonton, ids.lova, { kind: 'BIRTHDAY' })
        expect(never.status, never.body).toBe(200)
        const due = await sql(db => db`select id from messages where from_member_id = ${ids.tonton} and kind = 'NORMAL' and status = 'ACTIVE'`)
        await sql(db => db`update messages set first_listened_at = now() - interval '2 days', expires_at = now() - interval '1 day' where id = ${due[0]!.id}`)
        const ran = await request.get('/_nitro/tasks/messages:purge')
        expect(ran.ok(), await ran.text()).toBeTruthy()
        const [expired] = await sql(db => db`select status from messages where id = ${due[0]!.id}`)
        expect(expired!.status).toBe('EXPIRED')
        const [kept] = await sql(db => db`select status, expires_at from messages where id = ${never.id}`)
        expect(kept).toMatchObject({ status: 'ACTIVE', expires_at: null })
    })

    test('only a parent can delete a message and it frees the slot', async () => {
        const sent = await send(tonton, ids.lova)
        expect(sent.status, sent.body).toBe(200)
        expect((await tonton.delete(`/api/messages/${sent.id}`)).status()).toBe(403)
        expect((await lova.delete(`/api/messages/${sent.id}`)).status()).toBe(403)
        expect((await parent.delete(`/api/messages/${sent.id}`)).status()).toBe(200)
        expect(await messageById(lova, sent.id)).toBeUndefined()
        expect((await parent.delete(`/api/messages/${sent.id}`)).status()).toBe(404)
        expect((await send(tonton, ids.lova)).status).toBe(200)
    })

    test('the send button is disabled with the reason while a message is active', async ({ page }) => {
        await signIn(page.request, account)
        await chooseProfile(page, 'Mamie')
        await page.goto('/messages')
        const card = page.locator('.card', { hasText: 'Lova' })
        await expect(card.getByRole('button', { name: 'Lui envoyer un message' })).toBeDisabled()
        await expect(card.getByText(/Un message attend déjà Lova/)).toBeVisible()
    })

    test('the child replays the message and the reload does not block it', async ({ page }) => {
        await signIn(page.request, account)
        await chooseProfile(page, 'Lova')
        await page.goto('/kid')
        const mamieFace = page.locator('.face', { hasText: 'Mamie' })
        await mamieFace.locator('.face__link').click()
        await expect(page.getByTestId('message-player')).toBeVisible()
        await expect(page).toHaveURL(/\/kid\/[^/]+$/, { timeout: 15000 })
        await page.goto('/kid')
        await page.reload()
        await expect(mamieFace.locator('.face__link')).toHaveAttribute('data-ring', 'heard')
    })

    test('the status strip is pinned on top of the library on a tablet', async ({ page }) => {
        await page.setViewportSize({ width: 1180, height: 820 })
        await signIn(page.request, account)
        await chooseProfile(page, 'Lova')
        await page.goto('/kid/library')
        const strip = page.getByRole('navigation', { name: 'Messages de la famille' })
        await expect(strip).toBeVisible()
        await expect(strip).toHaveCSS('position', 'sticky')
        await page.setViewportSize({ width: 390, height: 800 })
        await expect(strip).toBeHidden()
    })
})
