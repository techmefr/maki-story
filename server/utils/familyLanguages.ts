import type { Sql } from 'postgres'
import { familyLanguagesOf } from '../../shared/utils/familyLanguages'
import { DEFAULT_LOCALE, LANGUAGES } from '../../shared/utils/languages'
import { badRequest } from './validate'

export const loadFamilyLanguages = async (db: Sql, familyId: string): Promise<string[]> => {
    const members = await db<{ spokenLanguages: string[] }[]>`
        select spoken_languages from members where family_id = ${familyId} and status = 'active' and deleted_at is null and source_member_id is null
    `
    return familyLanguagesOf(members, LANGUAGES.map(language => language.code), DEFAULT_LOCALE)
}

export const assertFamilyLanguages = async (db: Sql, familyId: string, codes: readonly string[]): Promise<void> => {
    const allowed = await loadFamilyLanguages(db, familyId)
    if (codes.some(code => !allowed.includes(code))) {
        return badRequest('This language is not spoken in the family')
    }
}
