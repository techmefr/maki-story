import { randomBytes } from 'node:crypto'
import { getDb, one } from '../db'
import { hashPassword } from '../password'
import type { ISessionStart } from '../session'
import { OAuthError } from './jwt'

const MAX_NAME_LENGTH = 60
const DEFAULT_PARENT_COLOR: VoiceColorId = 'sun'

export interface ISocialIdentity {
    provider: OAuthProviderId
    subject: string
    email: string
    isEmailVerified: boolean
    displayName: string
}

const firstFamilyOf = async (accountId: string): Promise<string | null> => {
    const [link] = await getDb()<{ familyId: string }[]>`
        select af.family_id from account_families af join families f on f.id = af.family_id
        where af.account_id = ${accountId} and f.deleted_at is null order by af.created_at limit 1
    `
    return link?.familyId ?? null
}

const sessionFor = async (accountId: string): Promise<ISessionStart> => {
    const familyId = await firstFamilyOf(accountId)
    if (!familyId) {
        throw new OAuthError('oauth_failed')
    }
    return { accountId, familyId, memberId: null }
}

export const resolveSocialAccount = async (identity: ISocialIdentity): Promise<ISessionStart> => {
    const db = getDb()
    const [known] = await db<{ accountId: string }[]>`
        select account_id from account_identities where provider = ${identity.provider} and subject = ${identity.subject}
    `
    if (known) {
        return sessionFor(known.accountId)
    }
    if (!identity.isEmailVerified || identity.email === '') {
        throw new OAuthError('email_unverified')
    }
    const [existing] = await db<{ id: string }[]>`select id from accounts where lower(email) = ${identity.email}`
    if (existing) {
        await db`
            insert into account_identities (provider, subject, account_id, email)
            values (${identity.provider}, ${identity.subject}, ${existing.id}, ${identity.email})
            on conflict do nothing
        `
        return sessionFor(existing.id)
    }
    const name = identity.displayName.trim().slice(0, MAX_NAME_LENGTH)
    const parentName = name === '' ? 'Parent' : name
    const familyName = name === '' ? 'Ma famille' : `Famille ${name}`
    const unusablePassword = await hashPassword(randomBytes(32).toString('base64url'))
    return db.begin(async tx => {
        const account = one(await tx<{ id: string }[]>`
            insert into accounts (email, password_hash) values (${identity.email}, ${unusablePassword}) returning id
        `)
        const family = one(await tx<{ id: string }[]>`
            insert into families (name, invite_code)
            values (${familyName}, substr(md5(random()::text || clock_timestamp()::text), 1, 10))
            returning id
        `)
        await tx`insert into members (family_id, name, role, color) values (${family.id}, ${parentName}, 'parent', ${DEFAULT_PARENT_COLOR})`
        await tx`insert into account_families (account_id, family_id) values (${account.id}, ${family.id})`
        await tx`
            insert into account_identities (provider, subject, account_id, email)
            values (${identity.provider}, ${identity.subject}, ${account.id}, ${identity.email})
        `
        return { accountId: account.id, familyId: family.id, memberId: null }
    })
}
