import { hasSession } from '../../utils/session'

export default defineEventHandler(event => {
    return { isSignedIn: hasSession(event) }
})
