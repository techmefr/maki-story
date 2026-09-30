import { logEvent } from '../utils/log'

const QUIET_PATHS = ['/api/auth/me', '/api/messages']
const startTimes = new WeakMap<object, number>()

export default defineNitroPlugin(nitroApp => {
    nitroApp.hooks.hook('request', event => {
        startTimes.set(event, Date.now())
    })
    nitroApp.hooks.hook('afterResponse', event => {
        const path = event.path.split('?')[0] ?? ''
        if (!path.startsWith('/api/') || (event.method === 'GET' && QUIET_PATHS.includes(path))) {
            return
        }
        const startedAt = startTimes.get(event) ?? Date.now()
        logEvent(`${event.method} ${path} -> ${event.node.res.statusCode} (${Date.now() - startedAt} ms)`)
    })
})
