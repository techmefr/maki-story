import { expect, test } from '@playwright/test'
import postgres from 'postgres'
import { chooseProfile, login, PARENT_NAME, uniqueAccount, signIn } from './helpers'

const DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgresql://tantara@localhost:5544/tantara_e2e'

const makeFree = async (familyName: string): Promise<void> => {
    const sql = postgres(DATABASE_URL)
    await sql`update families set plan = 'free' where name = ${familyName}`
    await sql.end()
}

const BOOK_LIMIT = 12
const ADULT_LIMIT = 8

test.describe('free plan limits', () => {
    test('the thirteenth book is refused and the library shows the usage', async ({ page, playwright, baseURL }) => {
        const account = uniqueAccount('plan-books')
        const api = await playwright.request.newContext({ baseURL })
        await signIn(api, account)
        await makeFree(account.familyName)
        await page.context().addCookies(await api.storageState().then(state => state.cookies))
        await page.goto('/profiles')
        await chooseProfile(page, PARENT_NAME)
        for (let index = 0; index < BOOK_LIMIT; index++) {
            const created = await page.request.post('/api/books', { data: { title: `Livre ${index}`, kind: 'multi', soloMemberId: null, type: 'wordless', isbn: '9782070612758', imageDesc: '', pageFileIds: [], lines: [] } })
            expect(created.ok(), await created.text()).toBeTruthy()
        }
        const refused = await page.request.post('/api/books', { data: { title: 'Livre de trop', kind: 'multi', soloMemberId: null, type: 'wordless', isbn: '9782070612758', imageDesc: '', pageFileIds: [], lines: [] } })
        expect(refused.status()).toBe(402)
        expect(await refused.text()).toContain('plan_book_limit')
        const plan = (await (await page.request.get('/api/plan')).json()) as { plan: string; books: number; limits: { books: number } }
        expect(plan.plan).toBe('free')
        expect(plan.books).toBe(BOOK_LIMIT)
        await page.goto('/library')
        await expect(page.getByTestId('plan-books-usage')).toContainText('12/12')
        await api.dispose()
    })

    test('the ninth adult is refused but children stay unlimited', async ({ page }) => {
        const account = uniqueAccount('plan-adults')
        await signIn(page.request, account)
        await makeFree(account.familyName)
        await page.goto('/profiles')
        await chooseProfile(page, PARENT_NAME)
        const existing = (await (await page.request.get('/api/members')).json()) as { role: string; status: string }[]
        const adults = existing.filter(member => member.role !== 'child').length
        for (let index = adults; index < ADULT_LIMIT; index++) {
            const created = await page.request.post('/api/members', { data: { name: `Proche ${index}`, role: 'relative', color: 'pink', code: { kind: 'pin', value: '123456' } } })
            expect(created.ok(), await created.text()).toBeTruthy()
        }
        const refused = await page.request.post('/api/members', { data: { name: 'Proche de trop', role: 'relative', color: 'pink', code: { kind: 'pin', value: '123456' } } })
        expect(refused.status()).toBe(402)
        expect(await refused.text()).toContain('plan_adult_limit')
        const child = await page.request.post('/api/members', { data: { name: `Enfant ${Date.now()}`, role: 'child', color: 'sky', code: { kind: 'symbols', value: '0000' } } })
        expect(child.ok(), await child.text()).toBeTruthy()
        const invite = await page.request.post('/api/invitations', { data: { channel: 'LINK', role: 'relative' } })
        expect(invite.status()).toBe(402)
    })

    test('only an instance administrator can change a plan', async ({ page }) => {
        await login(page)
        const denied = await page.request.put('/api/admin/families/unknown/plan', { data: { plan: 'lifetime' } })
        expect(denied.status()).toBe(403)
    })
})
