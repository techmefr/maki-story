import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createSupabaseIdentity, supabaseEnabled, verifySupabasePassword } from '../../technical/Auth/server/utils/supabase.ts'

test('Supabase is opt-in, rejects unknown providers and binds verified identity to the application account', async () => {
    const original = { provider: process.env.AUTH_PROVIDER, url: process.env.SUPABASE_URL, key: process.env.SUPABASE_SERVICE_ROLE_KEY, fetch: globalThis.fetch }
    try {
        delete process.env.AUTH_PROVIDER
        assert.equal(supabaseEnabled(), false)
        process.env.AUTH_PROVIDER = 'invalid'
        assert.throws(supabaseEnabled)
        process.env.AUTH_PROVIDER = 'supabase'
        assert.equal(supabaseEnabled(), true)
        process.env.SUPABASE_URL = 'https://credentials.example.invalid'
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'server-test-key'
        let confirmed = true
        let createFails = false
        let passwordFails = false
        const userId = '11111111-1111-4111-8111-111111111111'
        const user = () => ({ id: userId, aud: 'authenticated', email: 'parent@example.invalid', email_confirmed_at: confirmed ? new Date().toISOString() : undefined, app_metadata: { maki_account_id: 'account-1' }, user_metadata: {}, created_at: new Date().toISOString() })
        globalThis.fetch = async (input, options) => {
            const path = String(input)
            if (path.includes('/logout')) return new Response(null, { status: 204 })
            if (path.endsWith('/admin/users')) {
                if (createFails) return Response.json({ msg: 'User already registered' }, { status: 422 })
                const body = JSON.parse(String(options?.body)) as { email_confirm?: boolean; app_metadata?: { maki_account_id?: string } }
                assert.equal(body.email_confirm, true)
                assert.equal(body.app_metadata?.maki_account_id, 'account-1')
                return Response.json({ user: user() })
            }
            if (path.includes('/token?')) {
                if (passwordFails) return Response.json({ error: 'invalid_grant', error_description: 'Invalid credentials' }, { status: 400 })
                return Response.json({ user: user(), access_token: 'eyJhbGciOiJIUzI1NiJ9.eyJleHAiOjQxMDI0NDQ4MDB9.signature', refresh_token: 'test-refresh', token_type: 'bearer', expires_in: 3600 })
            }
            throw new Error('Unexpected provider request')
        }
        assert.equal(await createSupabaseIdentity('account-1', 'parent@example.invalid', 'test-password'), userId)
        assert.equal(await verifySupabasePassword('parent@example.invalid', 'test-password', userId, 'account-1'), userId)
        assert.equal(await verifySupabasePassword('parent@example.invalid', 'test-password', null, 'account-1'), userId)
        assert.equal(await verifySupabasePassword('parent@example.invalid', 'test-password', null, 'different-account'), null)
        assert.equal(await verifySupabasePassword('parent@example.invalid', 'test-password', 'different-user', 'account-1'), null)
        createFails = true
        assert.equal(await createSupabaseIdentity('account-1', 'parent@example.invalid', 'test-password'), userId)
        await assert.rejects(() => createSupabaseIdentity('different-account', 'parent@example.invalid', 'test-password'))
        passwordFails = true
        assert.equal(await verifySupabasePassword('parent@example.invalid', 'wrong-password', userId, 'account-1'), null)
        passwordFails = false
        confirmed = false
        assert.equal(await verifySupabasePassword('parent@example.invalid', 'test-password', userId, 'account-1'), null)
    } finally {
        for (const [key, value] of Object.entries({ AUTH_PROVIDER: original.provider, SUPABASE_URL: original.url, SUPABASE_SERVICE_ROLE_KEY: original.key })) {
            if (value === undefined) delete process.env[key]
            else process.env[key] = value
        }
        globalThis.fetch = original.fetch
    }
})
