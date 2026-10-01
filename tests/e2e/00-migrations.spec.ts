import { expect, test } from '@playwright/test'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import postgres from 'postgres'
import type { Sql } from 'postgres'
import { buildMigrations, migrateDown, migrateUp } from '../../server/utils/migrator'

const DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgresql://tantara@localhost:5544/tantara_e2e'
const SCHEMA = 'migration_test'
const DIRECTORY = join(process.cwd(), 'server', 'migrations')

const sources: Record<string, string> = {}
for (const file of readdirSync(DIRECTORY)) {
    sources[file] = readFileSync(join(DIRECTORY, file), 'utf8')
}
const migrations = buildMigrations(sources)

const describeSchema = async (db: Sql): Promise<string[]> => {
    const rows = await db<{ line: string }[]>`
        select format('%s.%s:%s:%s:%s', table_name, column_name, data_type, is_nullable, coalesce(column_default, '')) as line
        from information_schema.columns where table_schema = ${SCHEMA} and table_name <> 'schema_migrations' order by 1`
    return rows.map(row => row.line)
}

test.describe('migrations', () => {
    let admin: Sql
    let db: Sql

    test.beforeEach(async () => {
        admin = postgres(DATABASE_URL, { max: 1, onnotice: () => undefined })
        await admin.unsafe(`drop schema if exists ${SCHEMA} cascade`)
        await admin.unsafe(`create schema ${SCHEMA}`)
        db = postgres(DATABASE_URL, { max: 1, onnotice: () => undefined, connection: { search_path: SCHEMA } })
    })

    test.afterEach(async () => {
        await db.end()
        await admin.unsafe(`drop schema if exists ${SCHEMA} cascade`)
        await admin.end()
    })

    test('every migration has a down and applies in order', async () => {
        expect(migrations.length).toBeGreaterThan(1)
        for (const migration of migrations) {
            expect(migration.up.trim()).not.toBe('')
            expect(migration.down.trim()).not.toBe('')
        }
        expect(await migrateUp(db, migrations)).toEqual(migrations.map(item => item.name))
        expect(await migrateUp(db, migrations)).toEqual([])
    })

    test('migration names are unique and apply and revert in name order on a fresh database', async () => {
        const names = migrations.map(item => item.name)
        expect(new Set(names).size).toBe(names.length)
        expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)))
        const files = readdirSync(DIRECTORY)
        for (const name of names) {
            expect(files.filter(file => file === `${name}.up.sql`)).toHaveLength(1)
            expect(files.filter(file => file === `${name}.down.sql`)).toHaveLength(1)
        }
        expect(await migrateUp(db, migrations)).toEqual(names)
        const applied = await db<{ name: string }[]>`select name from schema_migrations order by applied_at, name`
        expect(applied.map(row => row.name)).toEqual(names)
        for (const name of [...names].reverse()) {
            expect(await migrateDown(db, migrations)).toBe(name)
        }
    })

    test('each down reverts its up and up can run again', async () => {
        await migrateUp(db, migrations)
        const full = await describeSchema(db)
        expect(full.length).toBeGreaterThan(0)
        for (let index = migrations.length - 1; index >= 0; index--) {
            expect(await migrateDown(db, migrations)).toBe(migrations[index]!.name)
        }
        expect(await describeSchema(db)).toEqual([])
        expect(await migrateDown(db, migrations)).toBeNull()
        await migrateUp(db, migrations)
        expect(await describeSchema(db)).toEqual(full)
    })

    test('a legacy database converges on the same schema without data loss', async () => {
        await migrateUp(db, migrations)
        const fresh = await describeSchema(db)
        await db.unsafe('drop table schema_migrations')
        await db`insert into families (id, name, invite_code) values ('fam', 'Famille', 'code')`
        await db`insert into members (id, family_id, name, role, color) values ('legacy', 'fam', 'Ancien', 'parent', 'sun')`
        expect(await migrateUp(db, migrations)).toEqual(migrations.map(item => item.name))
        expect(await describeSchema(db)).toEqual(fresh)
        const [member] = await db<{ name: string }[]>`select name from members where id = 'legacy'`
        expect(member?.name).toBe('Ancien')
    })

    test('the families migration back-fills existing rows into one family', async () => {
        await migrateUp(db, migrations.slice(0, 2))
        await db`insert into members (id, name, role, color) values ('m1', 'Maman', 'parent', 'sun')`
        await db`insert into files (id, mime, data) values ('f1', 'audio/wav', '\\x00')`
        await db`insert into books (id, title) values ('b1', 'Livre')`
        await db`insert into book_pages (book_id, position, file_id) values ('b1', 0, 'f1')`
        await db`insert into lines (id, book_id, position, text) values ('l1', 'b1', 0, 'Bonjour')`
        await db`insert into book_voices (book_id, member_id) values ('b1', 'm1')`
        await db`insert into messages (id, from_member_id, to_member_id, file_id, mime) values ('x1', 'm1', 'm1', 'f1', 'audio/wav')`
        await db`insert into feedback (id, text) values ('fb1', 'Super')`
        expect(await migrateUp(db, migrations)).toEqual(migrations.slice(2).map(item => item.name))
        const families = await db<{ id: string; ownerPending: boolean }[]>`select id, owner_pending as "ownerPending" from families`
        expect(families).toHaveLength(1)
        expect(families[0]!.ownerPending).toBe(true)
        for (const table of ['members', 'files', 'books', 'book_pages', 'lines', 'book_voices', 'messages', 'feedback']) {
            const rows = await db.unsafe<{ familyId: string }[]>(`select family_id as "familyId" from ${table}`)
            expect(rows).toHaveLength(1)
            expect(rows[0]!.familyId).toBe(families[0]!.id)
        }
        const [member] = await db<{ status: string; pinHash: string | null }[]>`select status, pin_hash as "pinHash" from members where id = 'm1'`
        expect(member).toEqual({ status: 'active', pinHash: null })
    })

    test('the book model migration derives characters from existing lines and reverts losslessly', async () => {
        const upTo = migrations.findIndex(item => item.name.startsWith('0005'))
        expect(upTo).toBeGreaterThan(0)
        await migrateUp(db, migrations.slice(0, upTo))
        await db`insert into families (id, name, invite_code) values ('fam', 'Famille', 'code')`
        await db`insert into members (id, family_id, name, role, color) values ('m1', 'fam', 'Maman', 'parent', 'sun')`
        await db`insert into books (id, family_id, title) values ('b1', 'fam', 'Livre')`
        await db`insert into lines (id, family_id, book_id, position, character, text, member_id) values
            ('l1', 'fam', 'b1', 0, 'Narrateur', 'Un', 'm1'),
            ('l2', 'fam', 'b1', 1, 'Zébu', 'Deux', null),
            ('l3', 'fam', 'b1', 2, 'zébu', 'Trois', null),
            ('l4', 'fam', 'b1', 3, '', 'Quatre', null)`
        await migrateUp(db, migrations)
        const characters = await db<{ name: string; isNarrator: boolean; color: string | null }[]>`
            select name, is_narrator as "isNarrator", color from characters where book_id = 'b1' order by position`
        expect(characters).toEqual([
            { name: 'Narrateur', isNarrator: true, color: 'sun' },
            { name: 'Zébu', isNarrator: false, color: null },
        ])
        const lines = await db<{ id: string; name: string | null }[]>`
            select l.id, c.name from lines l left join characters c on c.id = l.character_id order by l.position`
        expect(lines.map(line => line.name)).toEqual(['Narrateur', 'Zébu', 'Zébu', null])
        const [book] = await db<{ type: string; language: string; subtitle: string }[]>`select type, language, subtitle from books where id = 'b1'`
        expect(book).toEqual({ type: 'standard', language: 'fr', subtitle: '' })
        while ((await migrateDown(db, migrations)) !== migrations[upTo]!.name) {
            continue
        }
        const restored = await db<{ character: string; text: string }[]>`select character, text from lines order by position`
        expect(restored.map(line => line.character)).toEqual(['Narrateur', 'Zébu', 'zébu', ''])
    })

    test('the recordings migration back-fills existing audio as french, enforces the language and reverts', async () => {
        const upTo = migrations.findIndex(item => item.name.startsWith('0006'))
        expect(upTo).toBeGreaterThan(0)
        await migrateUp(db, migrations.slice(0, upTo))
        await db`insert into families (id, name, invite_code) values ('fam', 'Famille', 'code')`
        await db`insert into members (id, family_id, name, role, color) values ('m1', 'fam', 'Maman', 'parent', 'sun')`
        await db`insert into files (id, family_id, mime, data) values ('f1', 'fam', 'audio/webm', '\\x00')`
        await db`insert into books (id, family_id, title) values ('b1', 'fam', 'Livre')`
        await db`insert into lines (id, family_id, book_id, position, text, member_id, audio_file_id, audio_ms) values
            ('l1', 'fam', 'b1', 0, 'Un', 'm1', 'f1', 1200),
            ('l2', 'fam', 'b1', 1, 'Deux', 'm1', null, 0)`
        await migrateUp(db, migrations)
        const recordings = await db<{ lineId: string; language: string; mime: string; durationMs: number; status: string }[]>`
            select line_id as "lineId", language, mime, duration_ms as "durationMs", status from recordings`
        expect(recordings).toEqual([{ lineId: 'l1', language: 'fr', mime: 'audio/webm', durationMs: 1200, status: 'approved' }])
        await expect(
            db`insert into recordings (family_id, line_id, member_id, language, file_id, mime) values ('fam', 'l2', 'm1', null, 'f1', 'audio/webm')`,
        ).rejects.toThrow()
        await expect(
            db`insert into recordings (family_id, line_id, member_id, file_id, mime) values ('fam', 'l2', 'm1', 'f1', 'audio/webm')`,
        ).rejects.toThrow()
        await expect(
            db`insert into recordings (family_id, line_id, member_id, language, file_id, mime, status) values ('fam', 'l2', 'm1', 'fr', 'f1', 'audio/webm', 'bogus')`,
        ).rejects.toThrow()
        await db`update lines set audio_file_id = null, audio_ms = 0 where id = 'l1'`
        while ((await migrateDown(db, migrations)) !== migrations[upTo]!.name) {
            continue
        }
        const [line] = await db<{ audioFileId: string | null; audioMs: number }[]>`select audio_file_id as "audioFileId", audio_ms as "audioMs" from lines where id = 'l1'`
        expect(line).toEqual({ audioFileId: 'f1', audioMs: 1200 })
    })

    test('a fresh database gets no family', async () => {
        await migrateUp(db, migrations)
        const [row] = await db<{ count: number }[]>`select count(*)::int as count from families`
        expect(row?.count).toBe(0)
    })
})
