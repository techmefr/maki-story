import { isCronAuthorized } from '~~/technical/Auth/server/utils/cron'
import { purgeSupabaseIdentities } from '~~/technical/Auth/server/utils/identity-deletions'
import { ensureSchema, getDb } from '~~/server/utils/db'

export default defineEventHandler(async event => {
    if (!isCronAuthorized(getHeader(event, 'authorization'), process.env.CRON_SECRET)) {
        throw createError({ statusCode: 401, statusMessage: 'Not authorized' })
    }
    await ensureSchema()
    return purgeSupabaseIdentities(getDb())
})
