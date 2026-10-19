import { createClient } from '@supabase/supabase-js'

export const supabaseEnabled = (): boolean => {
    const provider = process.env.AUTH_PROVIDER ?? 'legacy'
    if (!['legacy', 'supabase'].includes(provider)) {
        throw new Error('Unknown account authentication provider')
    }
    return provider === 'supabase'
}

export const supabaseAdmin = () => {
    const url = process.env.SUPABASE_URL ?? ''
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''
    if (!url.startsWith('https://') || !key) {
        throw new Error('Supabase server credentials are not configured')
    }
    return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })
}

export const verifySupabasePassword = async (email: string, password: string, expectedId: string | null, accountId: string): Promise<string | null> => {
    const client = supabaseAdmin()
    const { data, error } = await client.auth.signInWithPassword({ email, password })
    if (error && ((error.status ?? 0) >= 500 || error.name === 'AuthRetryableFetchError')) {
        throw new Error('The credential provider is unavailable')
    }
    if (error || !data.user || !data.session) {
        return null
    }
    const user = data.user
    await client.auth.signOut({ scope: 'local' })
    if (user.email?.toLowerCase() !== email.toLowerCase() || !user.email_confirmed_at) {
        return null
    }
    return expectedId ? (user.id === expectedId ? user.id : null) : (user.app_metadata.maki_account_id === accountId ? user.id : null)
}

export const createSupabaseIdentity = async (accountId: string, email: string, password: string): Promise<string> => {
    const { data, error } = await supabaseAdmin().auth.admin.createUser({ email, password, email_confirm: true, app_metadata: { maki_account_id: accountId } })
    if (error || !data.user) {
        const recovered = await verifySupabasePassword(email, password, null, accountId)
        if (recovered) {
            return recovered
        }
        throw new Error('Supabase identity could not be provisioned')
    }
    return data.user.id
}
