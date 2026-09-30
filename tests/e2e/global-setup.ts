import postgres from 'postgres'

const TABLES = ['files', 'members', 'books', 'book_pages', 'lines', 'book_voices', 'messages', 'feedback']

export default async function globalSetup(): Promise<void> {
    const url = process.env.E2E_DATABASE_URL ?? 'postgresql://tantara@localhost:5544/tantara_e2e'
    const db = postgres(url, { max: 1, onnotice: () => undefined })
    try {
        for (const table of TABLES) {
            await db.unsafe(`drop table if exists ${table} cascade`)
        }
    } finally {
        await db.end()
    }
}
