import postgres from 'postgres'

export default async function globalSetup(): Promise<void> {
    const url = process.env.E2E_DATABASE_URL ?? 'postgresql://tantara@localhost:5544/tantara_e2e'
    const db = postgres(url, { max: 1, onnotice: () => undefined })
    try {
        await db.unsafe("drop schema public cascade")
        await db.unsafe("create schema public")
    } finally {
        await db.end()
    }
}
