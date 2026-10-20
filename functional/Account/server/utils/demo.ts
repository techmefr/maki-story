import type { H3Event } from 'h3'
import { isLocalDemo } from '~~/shared/utils/demo'

export const assertLocalDemo = (event: H3Event): void => {
    const host = getRequestURL(event).hostname
    if (!isLocalDemo(import.meta.dev, process.env.DEMO_MODE, process.env.DATABASE_URL, host)) {
        throw createError({ statusCode: 404, statusMessage: 'Not found' })
    }
}
