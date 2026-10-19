import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import postgres from 'postgres'
import { buildMigrations, migrateUp } from '../../server/utils/migrator.ts'
import { processIdentityDeletions } from '../../technical/Auth/server/utils/identity-deletion-queue.ts'
import { completeUpload } from '../../technical/Upload/server/utils/completeUpload.ts'
import { lockActiveConversation } from '../../functional/Message/server/utils/activeConversation.ts'

const adminUrl = process.env.MIGRATION_ADMIN_URL ?? 'postgresql://tantara@localhost:5544/postgres'
const database = 'tantara_message_vault_check'

test('real PostgreSQL serializes conversation and vault limits on independent connections', async () => {
    const url = new URL(adminUrl)
    assert.ok(['localhost', '127.0.0.1'].includes(url.hostname))
    const admin = postgres(adminUrl, { max: 1, onnotice: () => undefined })
    await admin.unsafe(`create database ${database}`)
    url.pathname = `/${database}`
    const db = postgres(url.toString(), { max: 12, onnotice: () => undefined })
    try {
        const directory = new URL('../../server/migrations/', import.meta.url)
        const sources = Object.fromEntries(readdirSync(directory).map(file => [file, readFileSync(new URL(file, directory), 'utf8')]))
        await migrateUp(db, buildMigrations(sources))
        const [family] = await db`insert into families (name, invite_code) values ('Concurrency check', 'concurrency-check') returning id`
        const [adult] = await db`insert into members (family_id, name, role, color) values (${family!.id}, 'Adult', 'parent', 'sun') returning id`
        const [child] = await db`insert into members (family_id, name, role, color) values (${family!.id}, 'Child', 'child', 'sun') returning id`
        const [file] = await db`insert into files (family_id, mime, data) values (${family!.id}, 'audio/ogg', ${Buffer.from('fixture')}) returning id`
        const send = (sender: string, recipient: string) => db.begin(async tx => {
            const count = await lockActiveConversation(tx, sender, recipient)
            if (count >= 5) return false
            await tx`insert into messages (family_id, from_member_id, to_member_id, file_id, mime, duration_ms) values (${family!.id}, ${sender}, ${recipient}, ${file!.id}, 'audio/ogg', 1000)`
            return true
        })
        for (const [sender, recipient] of [[adult!.id, child!.id], [child!.id, adult!.id]]) {
            const results = await Promise.all(Array.from({ length: 12 }, () => send(sender, recipient)))
            assert.equal(results.filter(Boolean).length, 5)
        }
        const [oldest] = await db`select id from messages where to_member_id = ${child!.id} order by created_at, id limit 1`
        await db`update messages set status = 'DELETED', deleted_at = now() where id = ${oldest!.id}`
        assert.equal(await send(adult!.id, child!.id), true)
        assert.equal(await send(adult!.id, child!.id), false)
        for (const owner of [child!.id, adult!.id]) {
            const results = await Promise.allSettled(Array.from({ length: 12 }, () => db.begin(async tx => {
                await tx`insert into treasures (family_id, child_id, from_member_id, file_id, mime, duration_ms) values (${family!.id}, ${owner}, ${adult!.id}, ${file!.id}, 'audio/ogg', 1000)`
            })))
            assert.equal(results.filter(result => result.status === 'fulfilled').length, 10)
            for (const result of results) {
                if (result.status === 'rejected') assert.equal(result.reason.code, '23514')
            }
        }
        await db`update treasures set deleted_at = now() where child_id = ${child!.id}`
        const [source] = await db`select id from messages where to_member_id = ${child!.id} and status = 'ACTIVE' limit 1`
        await db`insert into treasures (family_id, child_id, source_message_id, from_member_id, file_id, mime) values (${family!.id}, ${child!.id}, ${source!.id}, ${adult!.id}, ${file!.id}, 'audio/ogg')`
        assert.equal(await send(adult!.id, child!.id), true)
        assert.equal(await send(adult!.id, child!.id), false)
        const [upload] = await db`insert into upload_sessions (family_id, member_id, mime, size, received, expires_at) values (${family!.id}, ${adult!.id}, 'audio/ogg', 6, 6, now() + interval '1 hour') returning id`
        await db`insert into upload_chunks (upload_id, chunk_offset, data) values (${upload!.id}, 0, ${Buffer.from('abc')}), (${upload!.id}, 3, ${Buffer.from('def')})`
        const first = await db.begin(tx => completeUpload(tx, upload!.id, family!.id, adult!.id))
        const repeated = await Promise.all(Array.from({ length: 4 }, () => db.begin(tx => completeUpload(tx, upload!.id, family!.id, adult!.id))))
        assert.ok(repeated.every(id => id === first))
        const [assembled] = await db`select data from files where id = ${first}`
        assert.equal(assembled!.data.toString(), 'abcdef')
        const identityId = '11111111-1111-4111-8111-111111111111'
        const [account] = await db`insert into accounts (email, password_hash, supabase_user_id) values ('deletion@example.invalid', 'unusable-test-hash', ${identityId}) returning id`
        const pending = async () => (await db`select * from auth_identity_deletions`)
        assert.equal((await pending()).length, 0)
        await assert.rejects(() => db.begin(async tx => {
            await tx`delete from accounts where id = ${account!.id}`
            throw new Error('simulate local deletion rollback')
        }))
        assert.equal((await pending()).length, 0)
        await db`delete from accounts where id = ${account!.id}`
        assert.equal((await pending()).length, 1)
        const failed = await processIdentityDeletions(db, async () => { throw new Error('provider unavailable') })
        assert.equal(failed.deferred, 1)
        assert.equal((await pending())[0]!.attempts, 1)
        let removals = 0
        await Promise.all([1, 2].map(() => processIdentityDeletions(db, async userId => {
            assert.equal(userId, identityId)
            removals += 1
            await new Promise(resolve => setTimeout(resolve, 50))
        })))
        assert.equal(removals, 1)
        assert.equal((await pending()).length, 0)
        const [stillActive] = await db`insert into accounts (email, password_hash, supabase_user_id) values ('active@example.invalid', 'unusable-test-hash', ${identityId}) returning id`
        await db`insert into auth_identity_deletions (user_id) values (${identityId})`
        const guarded = await processIdentityDeletions(db, async () => { throw new Error('must not delete an active identity') })
        assert.equal(guarded.cancelled, 1)
        await db`update accounts set supabase_user_id = null where id = ${stillActive!.id}`
        await db`delete from accounts where id = ${stillActive!.id}`
        assert.equal((await pending()).length, 0)
    } finally {
        await db.end()
        await admin.unsafe(`drop database ${database}`)
        await admin.end()
    }
})
