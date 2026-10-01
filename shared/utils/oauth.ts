export const OAUTH_PROVIDER_IDS = ['google', 'apple'] as const

export const STATIC_UPCOMING_PROVIDERS = ['microsoft', 'facebook']

type Env = Record<string, string | undefined>

const has = (env: Env, ...keys: string[]): boolean => keys.every(key => (env[key] ?? '').trim() !== '')

export const isOAuthFake = (env: Env): boolean => env.OIDC_FAKE === '1'

export const isProviderConfigured = (env: Env, id: string): boolean => {
    const isFake = isOAuthFake(env)
    if (id === 'google') {
        return isFake ? has(env, 'GOOGLE_CLIENT_ID') : has(env, 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET')
    }
    if (id === 'apple') {
        return isFake ? has(env, 'APPLE_CLIENT_ID') : has(env, 'APPLE_CLIENT_ID', 'APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY')
    }
    return false
}

export const configuredProviders = (env: Env): OAuthProviderId[] => OAUTH_PROVIDER_IDS.filter(id => isProviderConfigured(env, id))

export const upcomingProviders = (env: Env): string[] => [
    ...OAUTH_PROVIDER_IDS.filter(id => !isProviderConfigured(env, id)),
    ...STATIC_UPCOMING_PROVIDERS,
]
