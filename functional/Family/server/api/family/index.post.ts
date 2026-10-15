import { defaultFamilyPlan } from '~~/server/utils/plan'
import { getDb, one } from '~~/server/utils/db'
import { birthDateForAge } from '~~/shared/utils/age'
import { requireSession } from '~~/server/utils/family'
import { logEvent } from '~~/server/utils/log'
import { hashCode, readCodeInput } from '~~/technical/Auth/server/utils/profile-code'
import { startSession } from '~~/technical/Auth/server/utils/session'
import { badRequest, isNonEmptyString } from '~~/server/utils/validate'

const MAX_NAME_LENGTH = 60
const MAX_CHILD_AGE = 17
const DEFAULT_PARENT_COLOR: VoiceColorId = 'sun'
const DEFAULT_CHILD_COLOR: VoiceColorId = 'sky'

const parentNameFromEmail = (email: string): string => {
    const local = email.split('@')[0] ?? ''
    return local === '' ? 'Parent' : `${local.charAt(0).toUpperCase()}${local.slice(1)}`.slice(0, MAX_NAME_LENGTH)
}

export default defineEventHandler(async (event): Promise<IAuthState> => {
    const session = requireSession(event)
    const body = await readBody<Partial<IFamilyCreateInput>>(event)
    const child = body.child
    const parent = body.parent
    if (!isNonEmptyString(body.familyName) || !child || !isNonEmptyString(child.name) || !parent || !isNonEmptyString(parent.firstName)) {
        return badRequest('A family name and a child are required')
    }
    if (!Number.isInteger(child.age) || child.age < 0 || child.age > MAX_CHILD_AGE) {
        return badRequest('Invalid age')
    }
    const parentCode = readCodeInput(body.parentCode, 'parent')
    const childCode = readCodeInput(child.code, 'child')
    const [parentHash, childHash] = await Promise.all([hashCode(parentCode), hashCode(childCode)])
    const db = getDb()
    const firstName = parent.firstName.trim().slice(0, MAX_NAME_LENGTH)
    const lastName = typeof parent.lastName === 'string' ? parent.lastName.trim().slice(0, MAX_NAME_LENGTH) : ''
    const displayName = (isNonEmptyString(parent.displayName) ? parent.displayName : firstName).trim().slice(0, MAX_NAME_LENGTH)
    const familyId = await db.begin(async tx => {
        const id = one(await tx<{ id: string }[]>`
            insert into families (name, invite_code, plan)
            values (${body.familyName!.trim().slice(0, MAX_NAME_LENGTH)}, substr(md5(random()::text || clock_timestamp()::text), 1, 10), ${defaultFamilyPlan()})
            returning id
        `).id
        await tx`
            insert into members (family_id, name, first_name, last_name, role, color, pin_hash, code_kind, code_enabled)
            values (${id}, ${displayName}, ${firstName}, ${lastName || null}, 'parent', ${DEFAULT_PARENT_COLOR}, ${parentHash}, ${parentCode.kind}, true)
        `
        await tx`
            insert into members (family_id, name, role, color, pin_hash, code_kind, birth_date, code_enabled)
            values (${id}, ${child.name.trim().slice(0, MAX_NAME_LENGTH)}, 'child', ${DEFAULT_CHILD_COLOR}, ${childHash}, ${childCode.kind}, ${birthDateForAge(child.age)}, true)
        `
        await tx`insert into account_families (account_id, family_id) values (${session.accountId}, ${id})`
        await tx`insert into memberships (account_id, family_id, role) values (${session.accountId}, ${id}, 'parent') on conflict (account_id, family_id) do nothing`
        return id
    })
    startSession(event, { accountId: session.accountId, familyId, memberId: null })
    logEvent('Famille créée')
    return { isSignedIn: true, memberId: null }
})
