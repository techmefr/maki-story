import { checkAge, checkAgeRange, checkBookType, checkLanguage, checkText } from '../../utils/bookModel'
import { loadBook } from '../../utils/books'
import { getDb } from '../../utils/db'
import { assertMembersInFamily } from '../../utils/family'
import { logEvent } from '../../utils/log'
import { requireBookEditor } from '../../utils/permissions'
import { markLineRecordingsStale } from '../../utils/recordings'
import { badRequest, isNonEmptyString, requireParam } from '../../utils/validate'

const STATUSES: BookStatus[] = ['draft', 'to_record', 'ready']

export default defineEventHandler(async (event): Promise<IBook> => {
    const { familyId } = await requireBookEditor(event)
    const id = requireParam(event, 'id')
    const body = await readBody<IBookPatch>(event)
    if (body.status !== undefined && !STATUSES.includes(body.status)) {
        return badRequest('Invalid status')
    }
    const current = await loadBook(id, familyId)
    const ageMin = body.ageMin === undefined ? current.ageMin : checkAge(body.ageMin)
    const ageMax = body.ageMax === undefined ? current.ageMax : checkAge(body.ageMax)
    checkAgeRange(ageMin, ageMax)
    const type = body.type === undefined ? current.type : checkBookType(body.type)
    const language = body.language === undefined ? current.language : checkLanguage(body.language)
    const subtitle = body.subtitle === undefined ? current.subtitle : checkText(body.subtitle, 'subtitle')
    const author = body.author === undefined ? current.author : checkText(body.author, 'author')
    const db = getDb()
    const patchedMemberIds = [
        ...Object.keys(body.tones ?? {}),
        ...(body.lines ?? []).flatMap(patch => (patch.memberId ? [patch.memberId] : [])),
    ]
    await assertMembersInFamily(db, familyId, patchedMemberIds)
    const characterIds = (body.lines ?? []).flatMap(patch => (patch.characterId ? [patch.characterId] : []))
    const panelIds = (body.lines ?? []).flatMap(patch => (patch.panelId ? [patch.panelId] : []))
    if (
        characterIds.some(characterId => !current.characters.some(character => character.id === characterId)) ||
        panelIds.some(panelId => !current.pages.some(page => page.panels.some(panel => panel.id === panelId)))
    ) {
        return badRequest('Unknown character or panel')
    }
    await db.begin(async tx => {
        if (body.title !== undefined && body.title.trim() !== '') {
            await tx`update books set title = ${body.title.trim()} where id = ${id} and family_id = ${familyId}`
        }
        await tx`
            update books set subtitle = ${subtitle}, author = ${author}, age_min = ${ageMin}, age_max = ${ageMax},
                language = ${language}, type = ${type}, tts_fallback = ${body.ttsFallback ?? current.ttsFallback}
            where id = ${id} and family_id = ${familyId}
        `
        if (body.imageDesc !== undefined) {
            await tx`update books set image_desc = ${body.imageDesc} where id = ${id} and family_id = ${familyId}`
        }
        if (body.status !== undefined) {
            await tx`update books set status = ${body.status} where id = ${id} and family_id = ${familyId}`
        }
        for (const [memberId, tone] of Object.entries(body.tones ?? {})) {
            await tx`
                insert into book_voices (book_id, family_id, member_id, tone) values (${id}, ${familyId}, ${memberId}, ${tone})
                on conflict (book_id, member_id) do update set tone = excluded.tone
            `
        }
        for (const patch of body.lines ?? []) {
            if (patch.memberId !== undefined) {
                await tx`
                    delete from recordings
                    where line_id = ${patch.id} and family_id = ${familyId} and member_id is distinct from ${patch.memberId}
                      and line_id in (select id from lines where book_id = ${id})
                `
                await tx`update lines set member_id = ${patch.memberId} where id = ${patch.id} and book_id = ${id} and family_id = ${familyId}`
            }
            let isEdited = false
            if (patch.text !== undefined) {
                if (!isNonEmptyString(patch.text)) {
                    return badRequest('A line needs text')
                }
                const changed = await tx`
                    update lines set text = ${patch.text.trim()}
                    where id = ${patch.id} and book_id = ${id} and family_id = ${familyId} and text is distinct from ${patch.text.trim()}
                    returning id
                `
                isEdited = isEdited || changed.length > 0
            }
            if (patch.note !== undefined) {
                await tx`update lines set note = ${patch.note} where id = ${patch.id} and book_id = ${id} and family_id = ${familyId}`
            }
            if (patch.tone !== undefined) {
                const tone = checkText(patch.tone, 'tone')
                const changed = await tx`
                    update lines set tone = ${tone}
                    where id = ${patch.id} and book_id = ${id} and family_id = ${familyId} and tone is distinct from ${tone}
                    returning id
                `
                isEdited = isEdited || changed.length > 0
            }
            if (isEdited) {
                await markLineRecordingsStale(tx, patch.id, familyId, current.language)
            }
            if (patch.sceneDescription !== undefined) {
                await tx`
                    update lines set scene_description = ${checkText(patch.sceneDescription, 'scene description')}
                    where id = ${patch.id} and book_id = ${id} and family_id = ${familyId}
                `
            }
            if (patch.characterId !== undefined) {
                await tx`
                    update lines set character_id = ${patch.characterId},
                        character = coalesce((select name from characters where id = ${patch.characterId}), '')
                    where id = ${patch.id} and book_id = ${id} and family_id = ${familyId}
                `
            }
            if (patch.panelId !== undefined) {
                await tx`update lines set panel_id = ${patch.panelId} where id = ${patch.id} and book_id = ${id} and family_id = ${familyId}`
            }
        }
    })
    const book = await loadBook(id, familyId)
    if (body.status !== undefined) {
        logEvent(`Livre « ${book.title} » passé en statut ${body.status}`)
    }
    return book
})
