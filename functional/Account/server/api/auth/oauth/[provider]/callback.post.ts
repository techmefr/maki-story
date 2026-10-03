import { handleOAuthCallback } from '~~/technical/Auth/server/utils/oauth/callback'

export default defineEventHandler(async event => {
    const body = ((await readBody(event)) ?? {}) as Record<string, unknown>
    const read = (key: string): string | undefined => (typeof body[key] === 'string' ? (body[key] as string) : undefined)
    await handleOAuthCallback(event, { code: read('code'), state: read('state'), error: read('error'), user: read('user') })
})
