import type { H3Event } from 'h3'
import { getDb } from './db'
import { requireSession } from './family'

const adminEmails = (): string[] => (process.env.INSTANCE_ADMIN_EMAILS ?? '').split(',').map(email => email.trim().toLowerCase()).filter(email => email !== '')

export const requireInstanceAdmin = async (event: H3Event): Promise<void> => {
    const session = requireSession(event)
    const [account] = await getDb()<{ email: string }[]>`select email from accounts where id = ${session.accountId}`
    if (!account || !adminEmails().includes(account.email.toLowerCase())) {
        throw createError({ statusCode: 403, statusMessage: 'Your profile cannot do this' })
    }
}
