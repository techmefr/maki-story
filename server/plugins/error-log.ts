import { ensureSchema, getDb } from '../utils/db'
import { recordError } from '../utils/journal'
import { readSession } from '~~/technical/Auth/server/utils/session'

const SERVER_ERROR_STATUS = 500

export default defineNitroPlugin(nitroApp => {
    nitroApp.hooks.hook('error', async (error, context) => {
        const event = context?.event
        const status = (error as { statusCode?: number }).statusCode ?? SERVER_ERROR_STATUS
        if (!event || status < SERVER_ERROR_STATUS) {
            return
        }
        try {
            await ensureSchema()
            const session = readSession(event)
            await recordError(event, {
                familyId: session?.familyId ?? null,
                source: 'SERVER',
                route: event.path,
                method: event.method,
                status,
                message: error.message,
                userAgent: getRequestHeader(event, 'user-agent') ?? '',
            }, getDb())
        } catch (_cause) {
            console.warn('[tantara] the error log is unavailable')
        }
    })
})
