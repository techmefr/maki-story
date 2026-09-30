import { getDb } from '../../utils/db'
import { logEvent } from '../../utils/log'
import { badRequest } from '../../utils/validate'

const MOODS: FeedbackMood[] = ['love', 'ok', 'bad']

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const body = await readBody<Partial<INewFeedback>>(event)
    const mood = body.mood && MOODS.includes(body.mood) ? body.mood : null
    const text = (body.text ?? '').trim()
    if (!mood && text === '') {
        return badRequest('Feedback is empty')
    }
    await getDb()`
        insert into feedback (member_name, screen, mood, text)
        values (${body.memberName ?? ''}, ${body.screen ?? ''}, ${mood}, ${text})
    `
    logEvent(`Avis reçu sur ${body.screen ?? '?'} (${mood ?? 'sans humeur'})`)
    return { ok: true }
})
