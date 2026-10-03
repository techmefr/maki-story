import { loadActor } from '~~/server/utils/permissions'
import { assertBookReadable } from '~~/server/utils/books'
import { loadPlaybackPlan } from '~~/server/utils/playback'
import { badRequest, requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<IPlaybackPlan> => {
    const actor = await loadActor(event)
    const bookId = requireParam(event, 'id')
    await assertBookReadable(actor, bookId)
    const raw = getQuery(event).languages
    const requested = raw === undefined ? null : parseLanguageList(raw)
    if (raw !== undefined && requested === null) {
        return badRequest('Invalid languages')
    }
    return loadPlaybackPlan(bookId, actor.familyId, actor.memberId, actor.role === 'child', requested)
})
