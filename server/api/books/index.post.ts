import { checkAge, checkAgeRange, checkBookType, checkColor, checkLanguage, checkName, checkPageKind, checkText, isNarratorName } from '../../utils/bookModel'
import { getDb, one } from '../../utils/db'
import { assertFilesInFamily, assertMembersInFamily, requireFamily } from '../../utils/family'
import { logEvent } from '../../utils/log'
import { badRequest, isNonEmptyString } from '../../utils/validate'

const MAX_PAGES = 40
const MAX_LINES = 400
const MAX_CHARACTERS = 40
const MAX_PANELS = 12

interface IPlannedCharacter {
    name: string
    color: string | null
    description: string
    isNarrator: boolean
}

export default defineEventHandler(async (event): Promise<{ id: string }> => {
    const familyId = requireFamily(event)
    const body = await readBody<Partial<INewBook>>(event)
    const lines = body.lines ?? []
    const kind: BookKind = body.kind === 'solo' ? 'solo' : 'multi'
    const type = body.type === undefined ? 'standard' : checkBookType(body.type)
    const pages: INewPage[] = body.pages ?? (body.pageFileIds ?? []).map(fileId => ({ fileId, kind: 'content' }))
    if (!isNonEmptyString(body.title)) {
        return badRequest('A title is required')
    }
    if ((lines.length === 0 && type !== 'wordless') || lines.length > MAX_LINES || pages.length > MAX_PAGES) {
        return badRequest('Invalid lines or pages')
    }
    if (lines.some(line => !isNonEmptyString(line.text))) {
        return badRequest('Every line needs text')
    }
    if (kind === 'solo' && !isNonEmptyString(body.soloMemberId)) {
        return badRequest('A solo book needs a reader')
    }
    const ageMin = checkAge(body.ageMin)
    const ageMax = checkAge(body.ageMax)
    checkAgeRange(ageMin, ageMax)
    const language = body.language === undefined ? 'fr' : checkLanguage(body.language)
    const subtitle = checkText(body.subtitle, 'subtitle')
    const author = checkText(body.author, 'author')
    const plannedPages = pages.map(page => {
        const pageKind = page.kind === undefined ? 'content' : checkPageKind(page.kind)
        if (page.fileId === null && pageKind !== 'empty') {
            return badRequest('Only an empty page can have no image')
        }
        if ((page.panels ?? []).length > MAX_PANELS) {
            return badRequest('Too many panels')
        }
        return {
            fileId: page.fileId,
            kind: pageKind,
            ttsFallback: page.ttsFallback === true,
            panels: (page.panels ?? []).map(panel => checkText(panel.description, 'panel')),
        }
    })
    const planned = new Map<string, IPlannedCharacter>()
    for (const character of body.characters ?? []) {
        const name = checkName(character.name)
        if (planned.has(name.toLowerCase())) {
            return badRequest('Duplicate character')
        }
        planned.set(name.toLowerCase(), {
            name,
            color: checkColor(character.color),
            description: checkText(character.description, 'description'),
            isNarrator: character.isNarrator === true || isNarratorName(name),
        })
    }
    for (const line of lines) {
        const name = (line.character ?? '').trim()
        if (name !== '' && !planned.has(name.toLowerCase())) {
            planned.set(name.toLowerCase(), { name, color: null, description: '', isNarrator: isNarratorName(name) })
        }
    }
    const characters = [...planned.values()]
    if (characters.length > MAX_CHARACTERS || characters.filter(character => character.isNarrator).length > 1) {
        return badRequest('Invalid characters')
    }
    const soloMemberId = kind === 'solo' ? (body.soloMemberId ?? null) : null
    const db = getDb()
    await assertFilesInFamily(db, familyId, plannedPages.flatMap(page => (page.fileId ? [page.fileId] : [])))
    await assertMembersInFamily(db, familyId, soloMemberId ? [soloMemberId] : [])
    const created = await db.begin(async tx => {
        const book = one(await tx<{ id: string }[]>`
            insert into books (family_id, title, subtitle, author, age_min, age_max, language, type, tts_fallback, kind, solo_member_id, status, image_desc)
            values (${familyId}, ${body.title!.trim()}, ${subtitle}, ${author}, ${ageMin}, ${ageMax}, ${language}, ${type},
                ${body.ttsFallback === true}, ${kind}, ${soloMemberId}, 'to_record', ${body.imageDesc ?? ''})
            returning id
        `)
        const panelIds = new Map<string, string>()
        for (const [position, page] of plannedPages.entries()) {
            const row = one(await tx<{ id: string }[]>`
                insert into book_pages (book_id, family_id, position, file_id, kind, tts_fallback)
                values (${book.id}, ${familyId}, ${position}, ${page.fileId}, ${page.kind}, ${page.ttsFallback})
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
        for (const [position, character] of characters.entries()) {
            const row = one(await tx<{ id: string }[]>`
                insert into characters (book_id, family_id, name, color, description, is_narrator, position)
                values (${book.id}, ${familyId}, ${character.name}, ${character.color}, ${character.description}, ${character.isNarrator}, ${position})
                returning id
            `)
            characterIds.set(character.name.toLowerCase(), row.id)
        }
        for (const [position, line] of lines.entries()) {
            const name = (line.character ?? '').trim()
            const characterId = name === '' ? null : (characterIds.get(name.toLowerCase()) ?? null)
            const panelId = line.panelPosition === undefined ? null : (panelIds.get(`${line.pageIndex}:${line.panelPosition}`) ?? null)
            if (line.panelPosition !== undefined && panelId === null) {
                return badRequest('Unknown panel')
            }
            await tx`
                insert into lines (book_id, family_id, position, page_index, character, character_id, panel_id, text, tone, scene_description, member_id)
                values (${book.id}, ${familyId}, ${position}, ${line.pageIndex}, ${name}, ${characterId}, ${panelId}, ${line.text.trim()},
                    ${checkText(line.tone, 'tone')}, ${checkText(line.sceneDescription, 'scene description')}, ${soloMemberId})
            `
        }
        return book
    })
    logEvent(`Livre créé : « ${body.title!.trim()} » (${lines.length} répliques, ${pages.length} pages)`)
    return created
})
