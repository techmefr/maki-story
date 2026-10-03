import { SESSION_COOKIE } from '~~/technical/Auth/server/utils/session'

export default defineEventHandler(event => {
    deleteCookie(event, SESSION_COOKIE, { path: '/' })
    return { ok: true }
})
