import postgres from 'postgres'
import type { Sql } from 'postgres'
import { SCHEMA_STATEMENTS } from './schema'

const LOCAL_HOSTS = ['localhost', '127.0.0.1']
const MAX_CONNECTIONS = 1

let client: Sql | null = null
let schemaReady: Promise<void> | null = null

const resolveUrl = (): string => {
    const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL
    if (!url) {
        throw createError({ statusCode: 500, statusMessage: 'Database is not configured' })
    }
    return url
}

export const getDb = (): Sql => {
    if (client) {
        return client
    }
    const url = resolveUrl()
    const isLocal = LOCAL_HOSTS.includes(new URL(url).hostname)
    client = postgres(url, {
        max: MAX_CONNECTIONS,
        prepare: false,
        ssl: isLocal ? false : 'require',
        transform: { column: { to: postgres.fromCamel, from: postgres.toCamel } },
    })
    return client
}

export const one = <T>(rows: readonly T[]): T => {
    const [row] = rows
    if (row === undefined) {
        throw createError({ statusCode: 500, statusMessage: 'Expected a row' })
    }
    return row
}

export const ensureSchema = (): Promise<void> => {
    if (schemaReady) {
        return schemaReady
    }
    const db = getDb()
    schemaReady = (async () => {
        for (const statement of SCHEMA_STATEMENTS) {
            await db.unsafe(statement)
        }
        const { count } = one(await db<{ count: number }[]>`select count(*)::int as count from members`)
        if (count === 0) {
            await db`insert into members (name, role, color) values ('Parent', 'parent', 'sun')`
        }
    })().catch(error => {
        schemaReady = null
        throw error
    })
    return schemaReady
}
