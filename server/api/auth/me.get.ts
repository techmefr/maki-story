import { readSession } from '../../utils/session'

export default defineEventHandler((event): IAuthState => {
    const session = readSession(event)
    return { isSignedIn: session !== null, memberId: session?.memberId ?? null }
})
