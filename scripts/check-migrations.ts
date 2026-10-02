import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import postgres from 'postgres'
import { buildMigrations, migrateDown, migrateUp } from '../server/utils/migrator.ts'

const DIRECTORY = join(import.meta.dirname, '..', 'server', 'migrations')
const SCRATCH = 'tantara_migration_check'
const ADMIN_URL = process.env.MIGRATION_ADMIN_URL ?? 'postgresql://tantara@localhost:5544/postgres'
const MAX_STEPS = 500

const run = async (): Promise<void> => {
    const sources: Record<string, string> = {}
    for (const file of readdirSync(DIRECTORY)) {
        sources[file] = readFileSync(join(DIRECTORY, file), 'utf8')
    }
    const migrations = buildMigrations(sources)
    const admin = postgres(ADMIN_URL, { max: 1, onnotice: () => undefined })
    await admin.unsafe(`drop database if exists ${SCRATCH}`)
    await admin.unsafe(`create database ${SCRATCH}`)
    const url = new URL(ADMIN_URL)
    url.pathname = `/${SCRATCH}`
    const db = postgres(url.toString(), { max: 1, onnotice: () => undefined })
    try {
        const applied = await migrateUp(db, migrations)
        let reverted = 0
        while (reverted < MAX_STEPS && (await migrateDown(db, migrations)) !== null) {
            reverted += 1
        }
        const reapplied = await migrateUp(db, migrations)
        if (applied.length !== reverted || reapplied.length !== applied.length) {
            throw new Error(`migrations are not reversible: applied ${applied.length}, reverted ${reverted}, reapplied ${reapplied.length}`)
        }
        console.log(`migrations ok: ${applied.length} up, ${reverted} down, ${reapplied.length} up again`)
    } finally {
        await db.end()
        await admin.unsafe(`drop database if exists ${SCRATCH}`)
        await admin.end()
    }
}

run().catch(error => {
    console.error(error)
    process.exit(1)
})
