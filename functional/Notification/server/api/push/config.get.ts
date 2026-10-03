import { requireSession } from '~~/server/utils/family'
import { isWebPushConfigured, webPushPublicKey } from '~~/technical/Mail/server/utils/push'

export default defineEventHandler((event): IPushConfig => {
    requireSession(event)
    return { webPublicKey: webPushPublicKey(), isWebEnabled: isWebPushConfigured() }
})
