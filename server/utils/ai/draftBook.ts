import type { Sql } from 'postgres'
import { one } from '../db'

export const insertAiDraftBook = async (
    db: Sql,
    familyId: string,
    draft: IAiBookDraft,
    pageFileIds: (string | null)[],
    ageMin: number | null,
    ageMax: number | null,
): Promise<string> => {
    return db.begin(async tx => {
        const book = one(await tx<{ id: string }[]>`
            insert into books (family_id, title, subtitle, age_min, age_max, language, written_language, voice_languages, kind, status, ai_generated, image_desc)
            values (${familyId}, ${draft.title}, ${draft.subtitle}, ${ageMin}, ${ageMax}, ${draft.language}, ${draft.language}, ${[draft.language]}, 'multi', 'draft', true, '')
            returning id
        `)
        const panelIds = new Map<string, string>()
        for (const [position, page] of draft.pages.entries()) {
            const fileId = pageFileIds[position] ?? null
            const row = one(await tx<{ id: string }[]>`
                insert into book_pages (book_id, family_id, position, file_id, kind, tts_fallback)
                values (${book.id}, ${familyId}, ${position}, ${fileId}, ${fileId ? 'content' : 'empty'}, false)
                returning id
            `)
            for (const [panelPosition, description] of page.panels.entries()) {
                const panel = one(await tx<{ id: string }[]>`
                    insert into panels (book_id, family_id, page_id, position, description)
                    values (${book.id}, ${familyId}, ${row.id}, ${panelPosition}, ${description})
                    returning id
                `)
                panelIds.set(`${position}:${panelPosition}`, panel.id)
            }
        }
        const characterIds = new Map<string, string>()
        const characters = [...draft.characters]
        for (const line of draft.lines) {
            const name = line.character.trim()
            if (name !== '' && !characters.some(character => character.name.toLowerCase() === name.toLowerCase())) {
                characters.push({ name, color: null, description: '', isNarrator: false })
            }
        }
        for (const [position, character] of characters.entries()) {
            const row = one(await tx<{ id: string }[]>`
                insert into characters (book_id, family_id, name, color, description, is_narrator, position)
                values (${book.id}, ${familyId}, ${character.name}, ${character.color}, ${character.description}, ${character.isNarrator}, ${position})
                returning id
            `)
            characterIds.set(character.name.toLowerCase(), row.id)
        }
        for (const [position, line] of draft.lines.entries()) {
            const name = line.character.trim()
            await tx`
                insert into lines (book_id, family_id, position, page_index, character, character_id, text, tone, scene_description)
                values (${book.id}, ${familyId}, ${position}, ${line.pageIndex}, ${name}, ${characterIds.get(name.toLowerCase()) ?? null},
                    ${line.text}, ${line.tone}, ${line.sceneDescription})
            `
        }
        return book.id
    })
}
