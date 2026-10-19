import { isCronAuthorized } from '~~/technical/Auth/server/utils/cron'
import { ensureSchema, getDb } from '~~/server/utils/db'
import { sendDailyDigests } from '~~/functional/Notification/server/utils/digest'

export default defineEventHandler(async event => {
    if (!isCronAuthorized(getHeader(event, 'authorization'), process.env.CRON_SECRET)) {
        throw createError({ statusCode: 401, statusMessage: 'Not authorized' })
    }
    await ensureSchema()
    return sendDailyDigests(getDb())
})
