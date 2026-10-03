import { getDb } from '~~/server/utils/db'
import { recordError } from '~~/server/utils/journal'
import { requireSession } from '~~/server/utils/family'
import { loadActor } from '~~/server/utils/permissions'

const MAX_CLIENT_ERRORS_PER_MINUTE = 20
const WINDOW_MS = 60_000
const hits = new Map<string, number[]>()

const isThrottled = (key: string): boolean => {
    const now = Date.now()
    const recent = (hits.get(key) ?? []).filter(time => now - time < WINDOW_MS)
    recent.push(now)
    hits.set(key, recent)
    return recent.length > MAX_CLIENT_ERRORS_PER_MINUTE
}

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const session = requireSession(event)
    if (isThrottled(session.accountId)) {
        throw createError({ statusCode: 429, statusMessage: 'Too many attempts, try again later' })
    }
    const body = await readBody<IClientErrorBody>(event)
    const actor = await loadActor(event).catch(() => null)
    await recordError(event, {
        familyId: session.familyId,
        source: 'CLIENT',
        route: typeof body?.route === 'string' ? body.route : '',
        message: typeof body?.message === 'string' ? body.message : '',
        appVersion: typeof body?.appVersion === 'string' ? body.appVersion : '',
        userAgent: getHeader(event, 'user-agent') ?? '',
        role: actor?.role ?? null,
    }, getDb())
    return { ok: true }
})
