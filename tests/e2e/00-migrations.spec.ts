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
        await db`insert into members (id, name, role, color) values ('legacy', 'Ancien', 'parent', 'sun')`
        expect(await migrateUp(db, migrations)).toEqual(migrations.map(item => item.name))
        expect(await describeSchema(db)).toEqual(fresh)
        const [member] = await db<{ name: string }[]>`select name from members where id = 'legacy'`
        expect(member?.name).toBe('Ancien')
    })
})
