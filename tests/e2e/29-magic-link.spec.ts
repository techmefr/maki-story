import { createHash, randomUUID } from 'node:crypto'
import { expect, test } from '@playwright/test'
import postgres from 'postgres'
import { signIn, uniqueAccount } from './helpers'

const DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgresql://tantara@localhost:5544/tantara_e2e'

const sql = async <T>(run: (db: postgres.Sql) => Promise<T>): Promise<T> => {
    const db = postgres(DATABASE_URL, { max: 1, onnotice: () => undefined })
    try {
        return await run(db)
    } finally {
        await db.end()
    }
}

const hash = (token: string): string => createHash('sha256').update(token).digest('hex')

test.describe('magic link', () => {
    test('signs in once, then refuses the same link, and refuses an expired one', async ({ playwright, baseURL, request }) => {
        const account = uniqueAccount('magiclink')
        const goodToken = `good-${randomUUID()}`
        const oldToken = `old-${randomUUID()}`
        await signIn(request, account)
        const accountId = await sql(async db => (await db<{ id: string }[]>`select id from accounts where lower(email) = ${account.email.toLowerCase()}`)[0]!.id)
        await sql(async db => {
            await db`insert into magic_links (account_id, token_hash, expires_at) values (${accountId}, ${hash(goodToken)}, now() + interval '15 minutes')`
            await db`insert into magic_links (account_id, token_hash, expires_at) values (${accountId}, ${hash(oldToken)}, now() - interval '1 minute')`
        })
        const visitor = await playwright.request.newContext({ baseURL })
        expect((await visitor.post('/api/auth/magic/verify', { data: { token: goodToken } })).status()).toBe(200)
        expect((await visitor.get('/api/auth/me')).ok()).toBe(true)
        const second = await playwright.request.newContext({ baseURL })
        expect((await second.post('/api/auth/magic/verify', { data: { token: goodToken } })).status()).toBe(410)
        expect((await second.post('/api/auth/magic/verify', { data: { token: oldToken } })).status()).toBe(410)
        expect((await second.post('/api/auth/magic/verify', { data: { token: 'never-issued' } })).status()).toBe(410)
        await visitor.dispose()
        await second.dispose()
    })
})
