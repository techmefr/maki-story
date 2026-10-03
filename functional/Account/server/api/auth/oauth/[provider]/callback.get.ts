import { handleOAuthCallback } from '~~/server/utils/oauth/callback'

export default defineEventHandler(async event => {
    const query = getQuery(event)
    const read = (key: string): string | undefined => (typeof query[key] === 'string' ? (query[key] as string) : undefined)
    await handleOAuthCallback(event, { code: read('code'), state: read('state'), error: read('error') })
})
