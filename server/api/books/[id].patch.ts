import { checkAge, checkAgeRange, checkBookType, checkLanguage, checkText } from '../../utils/bookModel'
import { loadBook } from '../../utils/books'
import { getDb } from '../../utils/db'
import { assertMembersInFamily, requireFamily } from '../../utils/family'
import { logEvent } from '../../utils/log'
import { badRequest, requireParam } from '../../utils/validate'

const STATUSES: BookStatus[] = ['draft', 'to_record', 'ready']

export default defineEventHandler(async (event): Promise<IBook> => {
    const familyId = requireFamily(event)
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
                    update lines set member_id = ${patch.memberId},
                        audio_file_id = case when member_id is distinct from ${patch.memberId} then null else audio_file_id end,
                        audio_ms = case when member_id is distinct from ${patch.memberId} then 0 else audio_ms end
                    where id = ${patch.id} and book_id = ${id} and family_id = ${familyId}
                `
            }
            if (patch.note !== undefined) {
                await tx`update lines set note = ${patch.note} where id = ${patch.id} and book_id = ${id} and family_id = ${familyId}`
            }
            if (patch.tone !== undefined) {
                await tx`update lines set tone = ${checkText(patch.tone, 'tone')} where id = ${patch.id} and book_id = ${id} and family_id = ${familyId}`
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
