import { logEvent } from '../../utils/log'
import { safeEqual, startSession } from '../../utils/session'

const FAILED_LOGIN_DELAY_MS = 600

interface ILoginBody {
    email?: string
    password?: string
}

export default defineEventHandler(async event => {
    const body = await readBody<ILoginBody>(event)
    const expectedEmail = process.env.TEST_ACCESS_EMAIL ?? ''
    const expectedPassword = process.env.TEST_ACCESS_PASSWORD ?? ''
    const isKnown =
        expectedEmail !== '' &&
        expectedPassword !== '' &&
        safeEqual((body.email ?? '').trim().toLowerCase(), expectedEmail.toLowerCase()) &&
        safeEqual(body.password ?? '', expectedPassword)
    if (!isKnown) {
        logEvent('Connexion refusée : e-mail ou mot de passe incorrect')
        await new Promise(resolve => setTimeout(resolve, FAILED_LOGIN_DELAY_MS))
        throw createError({ statusCode: 401, statusMessage: 'Wrong email or password' })
    }
    startSession(event)
    logEvent('Connexion réussie')
    return { ok: true }
})
