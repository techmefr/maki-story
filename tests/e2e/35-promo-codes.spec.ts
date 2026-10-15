import { expect, test } from '@playwright/test'
import postgres from 'postgres'
import { chooseProfile, PARENT_NAME, uniqueAccount, signIn } from './helpers'

const DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgresql://tantara@localhost:5544/tantara_e2e'

test.describe('promo codes', () => {
    test('a code grants premium once and is then refused', async ({ page }) => {
        const account = uniqueAccount('promo')
        await signIn(page.request, account)
        const sql = postgres(DATABASE_URL)
        await sql`update families set plan = 'free' where name = ${account.familyName}`
        const code = `TEST-${Date.now()}`
        await sql`insert into promo_codes (code, kind, days, max_uses) values (${code}, 'premium_days', 30, 5)`
        await page.goto('/profiles')
        await chooseProfile(page, PARENT_NAME)
        const redeemed = await page.request.post('/api/plan/redeem', { data: { code: code.toLowerCase() } })
        expect(redeemed.ok(), await redeemed.text()).toBeTruthy()
        expect(((await redeemed.json()) as { plan: string }).plan).toBe('premium')
        const again = await page.request.post('/api/plan/redeem', { data: { code } })
        expect(again.status()).toBe(400)
        const unknown = await page.request.post('/api/plan/redeem', { data: { code: 'NOPE' } })
        expect(unknown.status()).toBe(400)
        await sql`update families set plan_until = now() - interval '1 day' where name = ${account.familyName}`
        expect(((await (await page.request.get('/api/plan')).json()) as { plan: string }).plan).toBe('free')
        await sql.end()
    })
})
