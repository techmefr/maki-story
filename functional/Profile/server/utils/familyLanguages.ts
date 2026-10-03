import type { Sql } from 'postgres'
import { DEFAULT_LANGUAGE } from '~~/shared/utils/languages'

export const familyLanguageCodes = async (db: Sql, familyId: string): Promise<string[]> => {
    const rows = await db<{ code: string }[]>`
        select distinct unnest(spoken_languages) as code from members where family_id = ${familyId}
    `
    return [...new Set([DEFAULT_LANGUAGE, ...rows.map(row => row.code)])]
}

export const isOutsideFamily = async (db: Sql, familyId: string, requested: string[], alreadyChosen: string[]): Promise<boolean> => {
    const allowed = new Set([...(await familyLanguageCodes(db, familyId)), ...alreadyChosen])
    return requested.some(code => !allowed.has(code))
}
