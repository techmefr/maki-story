import { getDb } from '~~/server/utils/db'
import { logEvent } from '~~/server/utils/log'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { badRequest } from '~~/server/utils/validate'

const MOODS: FeedbackMood[] = ['love', 'ok', 'bad']

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const { familyId } = await requirePermission(event, 'feedback.send')
    const body = await readBody<Partial<INewFeedback>>(event)
    const mood = body.mood && MOODS.includes(body.mood) ? body.mood : null
    const text = (body.text ?? '').trim()
    if (!mood && text === '') {
        return badRequest('Feedback is empty')
    }
    await getDb()`
        insert into feedback (family_id, member_name, screen, mood, text)
        values (${familyId}, ${body.memberName ?? ''}, ${body.screen ?? ''}, ${mood}, ${text})
    `
    logEvent(`Avis reçu sur ${body.screen ?? '?'} (${mood ?? 'sans humeur'})`)
    return { ok: true }
})
