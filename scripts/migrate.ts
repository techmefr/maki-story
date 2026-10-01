import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import postgres from 'postgres'
import { buildMigrations, migrateDown, migrateUp } from '../server/utils/migrator.ts'

const DIRECTION = process.argv[2] ?? 'down'
const DIRECTORY = join(import.meta.dirname, '..', 'server', 'migrations')

const run = async (): Promise<void> => {
    const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
    if (!url) {
        throw new Error('DATABASE_URL is not set')
    }
    const sources: Record<string, string> = {}
    for (const file of readdirSync(DIRECTORY)) {
        sources[file] = readFileSync(join(DIRECTORY, file), 'utf8')
    }
    const migrations = buildMigrations(sources)
    const hostname = new URL(url).hostname
    const db = postgres(url, { max: 1, onnotice: () => undefined, ssl: ['localhost', '127.0.0.1'].includes(hostname) ? false : 'require' })
    try {
        if (DIRECTION === 'up') {
            console.log(`applied: ${(await migrateUp(db, migrations)).join(', ') || 'nothing'}`)
        } else {
            console.log(`reverted: ${(await migrateDown(db, migrations)) ?? 'nothing'}`)
        }
    } finally {
        await db.end()
    }
}

run().catch(error => {
    console.error(error)
    process.exit(1)
})
