import { requireSession } from '../../utils/family'
import { isWebPushConfigured, webPushPublicKey } from '../../utils/push'

export default defineEventHandler((event): IPushConfig => {
    requireSession(event)
    return { webPublicKey: webPushPublicKey(), isWebEnabled: isWebPushConfigured() }
})
