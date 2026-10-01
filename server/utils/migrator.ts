import type { Sql } from 'postgres'

export interface IMigration {
    name: string
    up: string
    down: string
}

const FILE_PATTERN = /([^/]+)\.(up|down)\.sql$/

export const buildMigrations = (sources: Record<string, string>): IMigration[] => {
    const byName = new Map<string, IMigration>()
    for (const [path, sql] of Object.entries(sources)) {
        const match = FILE_PATTERN.exec(path)
        if (!match) {
            continue
        }
        const [, name, direction] = match
        const entry = byName.get(name!) ?? { name: name!, up: '', down: '' }
        if (direction === 'up') {
            entry.up = sql
        } else {
            entry.down = sql
        }
        byName.set(name!, entry)
    }
    return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
}

const LOCK_KEY = 727301

const ensureTable = async (db: Sql): Promise<void> => {
    await db.unsafe('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())')
}

export const migrateUp = async (db: Sql, migrations: IMigration[]): Promise<string[]> => {
    const applied: string[] = []
    await db.begin(async tx => {
        await tx`select pg_advisory_xact_lock(${LOCK_KEY})`
        await ensureTable(tx as unknown as Sql)
        const done = new Set((await tx<{ name: string }[]>`select name from schema_migrations`).map(row => row.name))
        for (const migration of migrations) {
            if (done.has(migration.name)) {
                continue
            }
            await tx.unsafe(migration.up)
            await tx`insert into schema_migrations (name) values (${migration.name})`
            applied.push(migration.name)
        }
    })
    return applied
}

export const migrateDown = async (db: Sql, migrations: IMigration[]): Promise<string | null> => {
    let reverted: string | null = null
    await db.begin(async tx => {
        await tx`select pg_advisory_xact_lock(${LOCK_KEY})`
        await ensureTable(tx as unknown as Sql)
        const [latest] = await tx<{ name: string }[]>`select name from schema_migrations order by name desc limit 1`
        if (!latest) {
            return
        }
        const migration = migrations.find(item => item.name === latest.name)
        if (!migration) {
            throw new Error(`Migration ${latest.name} is applied but its files are missing`)
        }
        await tx.unsafe(migration.down)
        await tx`delete from schema_migrations where name = ${latest.name}`
        reverted = latest.name
    })
    return reverted
}
