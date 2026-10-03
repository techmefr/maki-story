import { getDb } from '~~/server/utils/db'
import { requireSession } from '~~/server/utils/family'
import { logEvent } from '~~/server/utils/log'
import { badRequest } from '~~/server/utils/validate'
import { TERMS_VERSION } from '~~/shared/utils/legal'

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const session = requireSession(event)
    const body = await readBody<Partial<IConsentInput>>(event)
    if (body.version !== TERMS_VERSION) {
        return badRequest('Unknown terms version')
    }
    await getDb()`update accounts set terms_version = ${TERMS_VERSION}, terms_accepted_at = now() where id = ${session.accountId}`
    logEvent('Conditions acceptées')
    return { ok: true }
})
