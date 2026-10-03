import type { Sql } from 'postgres'

export const TOGGLEABLE_PROVIDERS: ToggleableProviderId[] = ['apple', 'microsoft', 'facebook']

export const isToggleableProvider = (value: unknown): value is ToggleableProviderId => TOGGLEABLE_PROVIDERS.some(provider => provider === value)

export const readFamilyProviders = async (db: Sql, familyId: string): Promise<Record<ToggleableProviderId, boolean>> => {
    const rows = await db<{ provider: ToggleableProviderId; isEnabled: boolean }[]>`
        select provider, is_enabled from allowed_providers where family_id = ${familyId}
    `
    const result: Record<ToggleableProviderId, boolean> = { apple: true, microsoft: true, facebook: true }
    for (const row of rows) {
        result[row.provider] = row.isEnabled
    }
    return result
}

export const isProviderAllowedForAccount = async (db: Sql, accountId: string, provider: string): Promise<boolean> => {
    if (!isToggleableProvider(provider)) {
        return true
    }
    const [row] = await db<{ blocked: boolean }[]>`
        select coalesce(bool_and(coalesce(ap.is_enabled, true) = false), false) as blocked
        from memberships ms
        left join allowed_providers ap on ap.family_id = ms.family_id and ap.provider = ${provider}
        where ms.account_id = ${accountId} and ms.status = 'ACTIVE'
    `
    return row?.blocked !== true
}
