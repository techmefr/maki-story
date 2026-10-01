import { ensureSchema } from '../../utils/db'
import { isSessionCurrent, readSession } from '../../utils/session'

export default defineEventHandler(async (event): Promise<IAuthState> => {
    const session = readSession(event)
    if (!session) {
        return { isSignedIn: false, memberId: null }
    }
    await ensureSchema()
    if (!(await isSessionCurrent(session))) {
        return { isSignedIn: false, memberId: null }
    }
    return { isSignedIn: true, memberId: session.memberId }
})
