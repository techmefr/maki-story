import { buildMigrations } from './migrator'
import type { IMigration } from './migrator'

export const loadMigrations = async (): Promise<IMigration[]> => {
    const storage = useStorage('assets:migrations')
    const sources: Record<string, string> = {}
    for (const key of await storage.getKeys()) {
        const content = await storage.getItem<string>(key)
        sources[key.replace(/:/g, '/')] = String(content)
    }
    const migrations = buildMigrations(sources)
    if (migrations.length === 0) {
        throw createError({ statusCode: 500, statusMessage: 'No migrations bundled' })
    }
    return migrations
}
