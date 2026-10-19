import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { createSupabaseIdentity, deleteSupabaseIdentity, supabaseAdmin, verifySupabasePassword } from '../../technical/Auth/server/utils/supabase.ts'

const enabled = process.env.SUPABASE_LIVE_CHECK === '1'

test('dedicated Supabase project supports verified credentials, password changes and idempotent deletion', { skip: !enabled }, async () => {
    const accountId = randomUUID()
    const email = `maki-check-${accountId}@example.invalid`
    const password = `Maki-${randomUUID()}!`
    const changed = `Maki-${randomUUID()}!`
    let identity: string | undefined
    try {
        identity = await createSupabaseIdentity(accountId, email, password)
        assert.equal(await verifySupabasePassword(email, password, identity, accountId), identity)
        assert.equal(await verifySupabasePassword(email, password, null, randomUUID()), null)
        assert.equal(await createSupabaseIdentity(accountId, email, password), identity)
        const { error } = await supabaseAdmin().auth.admin.updateUserById(identity, { password: changed })
        assert.equal(error, null)
        assert.equal(await verifySupabasePassword(email, password, identity, accountId), null)
        assert.equal(await verifySupabasePassword(email, changed, identity, accountId), identity)
        await deleteSupabaseIdentity(identity)
        const missing = await supabaseAdmin().auth.admin.getUserById(identity)
        assert.equal(missing.error?.status, 404)
        await deleteSupabaseIdentity(identity)
    } finally {
        if (identity) await deleteSupabaseIdentity(identity)
    }
})
