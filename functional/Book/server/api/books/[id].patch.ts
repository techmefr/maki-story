import { checkAge, checkAgeRange, checkBookType, checkLanguage, checkMoods, checkText, checkThemes, checkVoiceLanguages } from '~~/server/utils/bookModel'
import { loadBook } from '~~/server/utils/books'
import { getDb } from '~~/server/utils/db'
import { assertMembersInFamily } from '~~/server/utils/family'
import { assertFamilyLanguages } from '~~/server/utils/familyLanguages'
import { actorEntry, record } from '~~/server/utils/journal'
import { logEvent } from '~~/server/utils/log'
import { notify } from '~~/server/utils/notifications'
import { requireActorMember, requireBookEditor } from '~~/technical/Auth/server/utils/permissions'
import { dropApprovedTake, markLineRecordingsStale } from '~~/server/utils/recordings'
import { approveBook, findReviewBook } from '~~/server/utils/review'
import { badRequest, isNonEmptyString, requireParam } from '~~/server/utils/validate'

const STATUSES: BookStatus[] = ['draft', 'to_record', 'in_review', 'ready']

export default defineEventHandler(async (event): Promise<IBook> => {
    const actor = await requireBookEditor(event)
    const { familyId } = actor
    const id = requireParam(event, 'id')
    const body = await readBody<IBookPatch>(event)
    if (body.status !== undefined && !STATUSES.includes(body.status)) {
        return badRequest('Invalid status')
    }
    if (body.status !== undefined && actor.role !== 'parent' && (body.status === 'ready' || body.status === 'in_review')) {
        throw createError({ statusCode: 403, statusMessage: 'A parent has to validate this book' })
    }
    if (body.childVisible !== undefined && body.childVisible !== null && typeof body.childVisible !== 'boolean') {
        return badRequest('Invalid child visibility')
    }
    if (body.childVisible !== undefined && actor.role !== 'parent') {
        throw createError({ statusCode: 403, statusMessage: 'A parent has to decide what a child can see' })
    }
    const current = await loadBook(id, familyId)
    if (body.status !== undefined && current.status === 'proposed' && body.status !== 'proposed') {
        throw createError({ statusCode: 403, statusMessage: 'A parent has to answer this proposal' })
    }
    const ageMin = body.ageMin === undefined ? current.ageMin : checkAge(body.ageMin)
    const ageMax = body.ageMax === undefined ? current.ageMax : checkAge(body.ageMax)
    checkAgeRange(ageMin, ageMax)
    const type = body.type === undefined ? current.type : checkBookType(body.type)
    const requestedLanguage = body.writtenLanguage ?? body.language
    const language = requestedLanguage === undefined ? current.language : checkLanguage(requestedLanguage)
    const voiceLanguages = body.voiceLanguages === undefined ? current.voiceLanguages : checkVoiceLanguages(body.voiceLanguages)
    const moods = body.moods === undefined ? current.moods : checkMoods(body.moods)
    const themes = body.themes === undefined ? current.themes : checkThemes(body.themes)
    const subtitle = body.subtitle === undefined ? current.subtitle : checkText(body.subtitle, 'subtitle')
    const author = body.author === undefined ? current.author : checkText(body.author, 'author')
    const illustrator = body.illustrator === undefined ? current.illustrator : checkText(body.illustrator, 'illustrator')
    const db = getDb()
    const patchedMemberIds = [
        ...Object.keys(body.tones ?? {}),
        ...(body.lines ?? []).flatMap(patch => (patch.memberId ? [patch.memberId] : [])),
    ]
    await assertMembersInFamily(db, familyId, patchedMemberIds)
    if (body.voiceLanguages !== undefined) {
        await assertFamilyLanguages(db, familyId, voiceLanguages.filter(code => !current.voiceLanguages.includes(code)))
    }
    const characterIds = (body.lines ?? []).flatMap(patch => (patch.characterId ? [patch.characterId] : []))
    const panelIds = (body.lines ?? []).flatMap(patch => (patch.panelId ? [patch.panelId] : []))
    if (
        characterIds.some(characterId => !current.characters.some(character => character.id === characterId)) ||
        panelIds.some(panelId => !current.pages.some(page => page.panels.some(panel => panel.id === panelId)))
    ) {
        return badRequest('Unknown character or panel')
    }
    const requestedMemberIds = new Set<string>()
    for (const patch of body.lines ?? []) {
        const line = current.lines.find(item => item.id === patch.id)
        if (patch.memberId && line && patch.memberId !== line.memberId && patch.memberId !== actor.memberId) {
            requestedMemberIds.add(patch.memberId)
        }
    }
    await db.begin(async tx => {
        if (body.childVisible !== undefined) {
            await tx`update books set child_visible = ${body.childVisible} where id = ${id} and family_id = ${familyId}`
        }
        if (body.title !== undefined && body.title.trim() !== '') {
            await tx`update books set title = ${body.title.trim()} where id = ${id} and family_id = ${familyId}`
        }
        await tx`
            update books set subtitle = ${subtitle}, author = ${author}, illustrator = ${illustrator || null}, age_min = ${ageMin}, age_max = ${ageMax},
                language = ${language}, written_language = ${language}, voice_languages = ${voiceLanguages}, moods = ${moods}, themes = ${themes}, type = ${type}, tts_fallback = ${body.ttsFallback ?? current.ttsFallback}
            where id = ${id} and family_id = ${familyId}
        `
        if (body.imageDesc !== undefined) {
            await tx`update books set image_desc = ${body.imageDesc} where id = ${id} and family_id = ${familyId}`
        }
        if (body.status === 'ready') {
            await approveBook(tx, familyId, await findReviewBook(tx, id, familyId), requireActorMember(actor))
        } else if (body.status !== undefined) {
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
                    delete from approved_takes
                    where line_id = ${patch.id} and family_id = ${familyId} and member_id is distinct from ${patch.memberId}
                      and line_id in (select id from lines where book_id = ${id})
                `
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
                    update lines set previous_text = text, text = ${patch.text.trim()}
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
                await markLineRecordingsStale(tx, patch.id, familyId, null, actor.memberId)
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
        if ((body.lines ?? []).some(patch => patch.memberId !== undefined)) {
            const conflicts = await tx<{ characterId: string }[]>`
                select character_id from lines
                where book_id = ${id} and family_id = ${familyId} and character_id is not null and member_id is not null
                group by character_id having count(distinct member_id) > 1
                limit 1
            `
            if (conflicts.length > 0) {
                return badRequest('A character has only one reader')
            }
        }
    })
    const book = await loadBook(id, familyId)
    for (const memberId of requestedMemberIds) {
        const [target] = await db<{ role: MemberRole }[]>`select role from members where id = ${memberId} and family_id = ${familyId} and deleted_at is null`
        if (target?.role === 'relative') {
            await notify(db, { familyId, recipientMemberId: memberId, kind: 'recording_request', payload: { bookId: id, bookTitle: book.title }, groupKey: `request:${id}:${memberId}` })
        }
    }
    await record(event, {
        ...actorEntry(actor),
        action: 'book.updated',
        entityType: 'book',
        entityId: id,
        before: { status: current.status, childVisible: current.childVisible },
        after: { status: book.status, childVisible: book.childVisible, linesPatched: (body.lines ?? []).length },
    })
    if (body.status !== undefined) {
        logEvent(`Livre « ${book.title} » passé en statut ${body.status}`)
    }
    return book
})
