import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import postgres from 'postgres'
import { chooseProfile, createReadyBook, makeWav, PARENT_NAME, PROFILE_PIN, signIn, uniqueAccount, useProfile } from './helpers'
import type { IE2eAccount } from './helpers'

test.describe.configure({ mode: 'serial' })

interface IId {
    id: string
}

interface ITreasureBoxRow {
    items: { id: string; fileId: string; sourceMessageId: string | null }[]
    limit: number
}

const DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgresql://tantara@localhost:5544/tantara_e2e'
const BOX_LIMIT = 10
const SENDERS = ['Mamie', 'Tonton', 'Tata', 'Papi', 'Cousin', 'Cousine', 'Voisin']

test.describe('player, treasure box and stories playback', () => {
    let account: IE2eAccount
    let parent: APIRequestContext
    let child: APIRequestContext
    let stranger: APIRequestContext
    const ids: Record<string, string> = {}

    const sql = async <T>(run: (db: postgres.Sql) => Promise<T>): Promise<T> => {
        const db = postgres(DATABASE_URL, { max: 1, onnotice: () => undefined })
        try {
            return await run(db)
        } finally {
            await db.end()
        }
    }

    const asProfile = async (playwright: { request: { newContext: (options: { baseURL?: string }) => Promise<APIRequestContext> } }, baseURL: string | undefined, name: string): Promise<APIRequestContext> => {
        const api = await playwright.request.newContext({ baseURL })
        await signIn(api, account)
        await useProfile(api, name)
        return api
    }

    const insertMessages = async (count: number): Promise<string[]> => {
        const upload = await parent.post('/api/files', { data: makeWav(300), headers: { 'content-type': 'audio/wav' } })
        const fileId = ((await upload.json()) as IId).id
        const senders = [PARENT_NAME, ...SENDERS].map(name => ids[name]!)
        return sql(async db => {
            const created: string[] = []
            for (let index = 0; index < count; index++) {
                const sender = senders[index % senders.length]!
                const kind = index < senders.length ? 'NORMAL' : 'BIRTHDAY'
                const [row] = await db<IId[]>`
                    insert into messages (family_id, from_member_id, to_member_id, file_id, mime, duration_ms, kind)
                    select family_id, ${sender}, ${ids.Lova!}, ${fileId}, 'audio/wav', 300, ${kind} from members where id = ${ids.Lova!}
                    returning id
                `
                created.push(row!.id)
            }
            return created
        })
    }

    test.beforeAll(async ({ playwright, baseURL }) => {
        account = uniqueAccount('player')
        parent = await playwright.request.newContext({ baseURL })
        await signIn(parent, account)
        await useProfile(parent, PARENT_NAME)
        const members = (await (await parent.get('/api/members')).json()) as (IId & { name: string })[]
        ids[PARENT_NAME] = members.find(member => member.name === PARENT_NAME)!.id
        for (const [name, role] of [...SENDERS.map(sender => [sender, 'relative'] as const), ['Lova', 'child'] as const]) {
            const response = await parent.post('/api/members', { data: { name, role, color: 'coral', code: { kind: 'pin', value: PROFILE_PIN } } })
            expect(response.ok(), await response.text()).toBeTruthy()
            ids[name] = ((await response.json()) as IId).id
        }
        child = await asProfile(playwright, baseURL, 'Lova')
        const otherAccount = uniqueAccount('player-other')
        stranger = await playwright.request.newContext({ baseURL })
        await signIn(stranger, otherAccount)
        await useProfile(stranger, PARENT_NAME)
    })

    test('concurrent hearts never exceed the box limit and the copy survives the purge', async () => {
        const messageIds = await insertMessages(BOX_LIMIT + 3)
        const results = await Promise.all(messageIds.map(messageId => child.post('/api/treasure', { data: { messageId } })))
        const statuses = results.map(result => result.status())
        expect(statuses.filter(status => status === 200)).toHaveLength(BOX_LIMIT)
        expect(statuses.filter(status => status === 409)).toHaveLength(3)
        const box = (await (await child.get('/api/treasure')).json()) as ITreasureBoxRow
        expect(box.items).toHaveLength(BOX_LIMIT)
        expect(box.limit).toBe(BOX_LIMIT)
        await sql(db => db`update messages set status = 'EXPIRED', expires_at = now() - interval '1 minute' where to_member_id = ${ids.Lova!}`)
        await child.get('/api/messages')
        const copy = await child.get(`/api/files/${box.items[0]!.fileId}`)
        expect(copy.status()).toBe(200)
        const originals = await sql(db => db`select count(*)::int as total from files where id in (select file_id from messages where to_member_id = ${ids.Lova!})`)
        expect(originals[0]!.total).toBe(0)
    })

    test('a full box refuses a new heart with a conflict, a child cannot delete, a parent can', async () => {
        const [messageId] = await insertMessages(1)
        const full = await child.post('/api/treasure', { data: { messageId } })
        expect(full.status()).toBe(409)
        const box = (await (await child.get('/api/treasure')).json()) as ITreasureBoxRow
        const removedByChild = await child.delete(`/api/treasure/${box.items[0]!.id}`)
        expect(removedByChild.status()).toBe(403)
        const removedByParent = await parent.delete(`/api/treasure/${box.items[0]!.id}`)
        expect(removedByParent.status()).toBe(200)
        const retry = await child.post('/api/treasure', { data: { messageId } })
        expect(retry.status()).toBe(200)
        await sql(db => db`update messages set status = 'EXPIRED' where to_member_id = ${ids.Lova!}`)
    })

    test('relatives and other families cannot read the box', async ({ playwright, baseURL }) => {
        const mamie = await asProfile(playwright, baseURL, 'Mamie')
        const own = (await (await mamie.get(`/api/treasure?childId=${ids.Lova!}`)).json()) as ITreasureBoxRow
        expect(own.items).toHaveLength(0)
        const foreign = (await (await stranger.get(`/api/treasure?childId=${ids.Lova!}`)).json()) as ITreasureBoxRow
        expect(foreign.items).toHaveLength(0)
        const copyId = ((await (await child.get('/api/treasure')).json()) as ITreasureBoxRow).items[0]!.fileId
        expect((await stranger.get(`/api/files/${copyId}`)).status()).not.toBe(200)
        expect((await mamie.get(`/api/files/${copyId}`)).status()).toBe(403)
        await mamie.dispose()
    })

    test('the child opens the chest, a parent removes a memory after confirming', async ({ page }) => {
        await signIn(page.request, account)
        await chooseProfile(page, 'Lova')
        await expect(page.getByTestId('treasure-chest')).toBeVisible()
        await page.getByTestId('treasure-chest').click()
        await expect(page.getByTestId('treasure-counter')).toContainText(`${BOX_LIMIT}/${BOX_LIMIT}`)
        await expect(page.getByTestId('treasure-item')).toHaveCount(BOX_LIMIT)
        await expect(page.getByRole('button', { name: 'Retirer ce souvenir' })).toHaveCount(0)
        await page.goto('/profiles')
        await chooseProfile(page, PARENT_NAME)
        await page.goto(`/kid/treasure?child=${ids.Lova!}`)
        await page.getByRole('button', { name: 'Retirer ce souvenir' }).first().click()
        await page.getByRole('button', { name: 'Retirer', exact: true }).click()
        await expect(page.getByTestId('treasure-item')).toHaveCount(BOX_LIMIT - 1)
    })

    test('a message plays on one tap, the heart saves it and prev/next are reachable', async ({ page }) => {
        const [messageId] = await insertMessages(1)
        await signIn(page.request, account)
        await chooseProfile(page, 'Lova')
        const face = page.locator('.face__link', { hasText: 'Parent' })
        await expect(face).toHaveAttribute('data-ring', 'unheard')
        await page.goto(`/message/listen/${messageId}`)
        await expect(page.getByTestId('message-player')).toBeVisible()
        await expect(page.getByTestId('message-previous')).toBeDisabled()
        await page.getByTestId('treasure-heart').getByRole('button').click()
        await expect(page.getByTestId('treasure-heart').getByRole('button')).toHaveAttribute('aria-pressed', 'true')
        await expect(page.getByTestId('treasure-count')).toContainText(`${BOX_LIMIT}/${BOX_LIMIT}`)
        await page.getByTestId('message-next').focus()
        await expect(page.getByTestId('message-next')).toBeFocused()
    })

    test.describe('reader', () => {
        test.use({ contextOptions: { reducedMotion: 'no-preference' } })

        test('the previous page button and the self pausing wiggle', async ({ page }, info) => {
            await signIn(page.request, account)
            await page.goto('/profiles')
            const title = `Histoire lecteur ${info.project.name}`
            const bookId = await createReadyBook(page, title, 'multi', [
                { pageIndex: 0, character: 'Narrateur', text: 'Un', memberName: PARENT_NAME },
                { pageIndex: 1, character: 'Petit', text: 'Deux', memberName: 'Lova' },
            ])
            await chooseProfile(page, 'Lova')
            await page.goto(`/kid/listen/${bookId}`)
            const start = page.getByRole('button', { name: 'Lire' })
            await expect(start).toBeVisible()
            await expect.poll(() => start.evaluate(element => element.getAnimations().length)).toBeGreaterThan(0)
            await expect.poll(() => start.evaluate(element => element.getAnimations().length), { timeout: 5000 }).toBe(0)
            await start.click()
            await expect(page.getByText('Page suivante')).toBeVisible({ timeout: 20000 })
            await page.getByTestId('turn-page').click()
            await expect(page.getByText('Page 2/2')).toBeVisible()
            await page.getByTestId('previous-page').click()
            await expect(page.getByText('Page 1/2')).toBeVisible()
        })

        test('the treasure page has no horizontal overflow at 320px', async ({ page }) => {
            await page.setViewportSize({ width: 320, height: 640 })
            await signIn(page.request, account)
            await chooseProfile(page, 'Lova')
            await page.goto('/kid/treasure')
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
            expect(overflow).toBe(false)
        })
    })
})
