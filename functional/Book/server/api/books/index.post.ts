import { checkAge, checkAgeRange, checkBookType, checkColor, checkLanguage, checkMoods, checkName, checkPageKind, checkText, checkThemes, checkVoiceLanguages } from '~~/server/utils/bookModel'
import { getDb, one } from '~~/server/utils/db'
import { assertFilesInFamily, assertMembersInFamily } from '~~/server/utils/family'
import { fetchCoverImage, normalizeIsbn } from '~~/server/utils/isbn'
import { assertCanCreateBooks } from '~~/server/utils/plan'
import { assertFamilyLanguages } from '~~/server/utils/familyLanguages'
import { actorEntry, record } from '~~/server/utils/journal'
import { logEvent } from '~~/server/utils/log'
import { notify } from '~~/server/utils/notifications'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { badRequest, isNonEmptyString } from '~~/server/utils/validate'

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

const memberNameOf = async (memberId: string | null): Promise<string> => {
    if (memberId === null) {
        return ''
    }
    const [row] = await getDb()<{ name: string }[]>`select name from members where id = ${memberId}`
    return row?.name ?? ''
}

export default defineEventHandler(async (event): Promise<{ id: string }> => {
    const actor = await requirePermission(event, 'books.create')
    const { familyId } = actor
    const body = await readBody<Partial<INewBook>>(event)
    if (actor.role === 'relative' && (body.kind !== 'solo' || body.soloMemberId !== actor.memberId)) {
        throw createError({ statusCode: 403, statusMessage: 'A relative can only create a book read by themselves' })
    }
    const isProposal = body.isProposal === true
    if (isProposal && actor.role !== 'relative') {
        return badRequest('Only a relative can propose a book')
    }
    const lines = body.lines ?? []
    const kind: BookKind = body.kind === 'solo' ? 'solo' : 'multi'
    const type = body.type === undefined ? 'standard' : checkBookType(body.type)
    const isbn = normalizeIsbn(body.isbn)
    const coverUrl = typeof body.coverUrl === 'string' && body.coverUrl.startsWith('https://') ? body.coverUrl.slice(0, 500) : null
    const pages: INewPage[] = body.pages ?? (body.pageFileIds ?? []).map(fileId => ({ fileId, kind: 'content' }))
    if (!isNonEmptyString(body.title)) {
        return badRequest('A title is required')
    }
    if ((lines.length === 0 && pages.length === 0 && isbn === null) || lines.length > MAX_LINES || pages.length > MAX_PAGES) {
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
    const language = checkLanguage(body.writtenLanguage ?? body.language ?? 'fr')
    const voiceLanguages = body.voiceLanguages === undefined ? [language] : checkVoiceLanguages(body.voiceLanguages)
    if (body.voiceLanguages !== undefined) {
        await assertFamilyLanguages(getDb(), familyId, voiceLanguages)
    }
    const moods = body.moods === undefined ? [] : checkMoods(body.moods)
    const themes = body.themes === undefined ? [] : checkThemes(body.themes)
    const subtitle = checkText(body.subtitle, 'subtitle')
    const author = checkText(body.author, 'author')
    const illustrator = checkText(body.illustrator, 'illustrator')
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
            title: checkText(page.title ?? '', 'page title'),
            description: checkText(page.description, 'page description'),
            panels: (page.panels ?? []).map(panel => checkText(panel.description, 'panel')),
        }
    })
    const planned = new Map<string, IPlannedCharacter>()
    for (const character of body.characters ?? []) {
        const name = checkName(character.name)
        if (planned.has(name.toLowerCase())) {
            return badRequest('Duplicate character')
        }
        const isNarrator = character.isNarrator === true
        planned.set(name.toLowerCase(), {
            name,
            color: isNarrator ? null : checkColor(character.color),
            description: checkText(character.description, 'description'),
            isNarrator,
        })
    }
    for (const line of lines) {
        const name = (line.character ?? '').trim()
        if (name !== '' && !planned.has(name.toLowerCase())) {
            planned.set(name.toLowerCase(), { name, color: null, description: '', isNarrator: false })
        }
    }
    const characters = [...planned.values()]
    if (characters.length > MAX_CHARACTERS || characters.filter(character => character.isNarrator).length > 1) {
        return badRequest('Invalid characters')
    }
    const soloMemberId = kind === 'solo' ? (body.soloMemberId ?? null) : null
    const db = getDb()
    await assertCanCreateBooks(db, familyId)
    if (plannedPages.length === 0 && coverUrl !== null) {
        const cover = await fetchCoverImage(coverUrl)
        if (cover) {
            const file = one(await db<{ id: string }[]>`
                insert into files (family_id, mime, data, created_by_member_id) values (${familyId}, ${cover.mime}, ${cover.data}, ${actor.memberId}) returning id
            `)
            plannedPages.push({ fileId: file.id, kind: 'cover', ttsFallback: false, title: '', description: '', panels: [] })
        }
    }
    await assertFilesInFamily(db, familyId, plannedPages.flatMap(page => (page.fileId ? [page.fileId] : [])))
    await assertMembersInFamily(db, familyId, soloMemberId ? [soloMemberId] : [])
    const created = await db.begin(async tx => {
        const book = one(await tx<{ id: string }[]>`
            insert into books (family_id, title, subtitle, author, illustrator, age_min, age_max, language, written_language, voice_languages, moods, themes, type, tts_fallback, kind, solo_member_id, status, image_desc, isbn, cover_url)
            values (${familyId}, ${body.title!.trim()}, ${subtitle}, ${author}, ${illustrator || null}, ${ageMin}, ${ageMax}, ${language}, ${language}, ${voiceLanguages}, ${moods}, ${themes}, ${type},
                ${body.ttsFallback === true}, ${kind}, ${soloMemberId}, ${isProposal ? 'proposed' : 'to_record'}, ${body.imageDesc ?? ''}, ${isbn}, ${coverUrl})
            returning id
        `)
        const panelIds = new Map<string, string>()
        for (const [position, page] of plannedPages.entries()) {
            const row = one(await tx<{ id: string }[]>`
                insert into book_pages (book_id, family_id, position, file_id, kind, tts_fallback, title, description)
                values (${book.id}, ${familyId}, ${position}, ${page.fileId}, ${page.kind}, ${page.ttsFallback}, ${page.title}, ${page.description})
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
    if (isProposal) {
        await notify(db, { familyId, recipientMemberId: null, kind: 'book_proposed', payload: { bookId: created.id, bookTitle: body.title!.trim(), memberName: await memberNameOf(actor.memberId) }, groupKey: `proposal:${created.id}` })
    }
    await record(event, { ...actorEntry(actor), action: isProposal ? 'book.proposed' : 'book.created', entityType: 'book', entityId: created.id, after: { kind, type, lines: lines.length, pages: pages.length } })
    logEvent(`Livre créé : « ${body.title!.trim()} » (${lines.length} répliques, ${pages.length} pages)`)
    return created
})
