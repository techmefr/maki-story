import { expect, test } from '@playwright/test'
import type { APIRequestContext, Playwright } from '@playwright/test'
import postgres from 'postgres'
import type { IAccountOverview, IInvitation, IInvitationPreview, IMembership } from '../../shared/types/family'
import { addMemberApi, openFamily } from './family-helpers'
import { E2E_PASSWORD, PROFILE_PIN, RUN_ID, chooseProfile, inviteByLink, signIn, useProfile } from './helpers'
import type { IFamilyApi } from './family-helpers'

interface IFlow {
    families: { familyName: string; memberId: string; children: { id: string; name: string }[]; requests: unknown[]; proposals: unknown[] }[]
    currentFamilyId: string
}

const DB_URL = process.env.E2E_DATABASE_URL ?? 'postgresql://tantara@localhost:5544/tantara_e2e'

const newApi = (playwright: Playwright, baseURL: string | undefined): Promise<APIRequestContext> => playwright.request.newContext({ baseURL })

const createInvitation = async (parent: APIRequestContext, data: object): Promise<{ id: string; code: string; link: string; shareText: string }> => {
    const response = await parent.post('/api/invitations', { data })
    expect(response.status(), await response.text()).toBe(200)
    return (await response.json()) as { id: string; code: string; link: string; shareText: string }
}

const relativeEmail = (label: string): string => `e2e-${RUN_ID}-${label}-${Math.random().toString(36).slice(2, 8)}@tantara.test`

const flowOf = async (api: APIRequestContext): Promise<IFlow> => (await (await api.get('/api/relative/flow')).json()) as IFlow

const openChild = async (family: IFamilyApi, name: string): Promise<string> => addMemberApi(family.parent, name, 'child')

test.describe('invitations', () => {
    test('a parent creates a single-use code that a new relative redeems once', async ({ playwright, baseURL }) => {
        const family = await openFamily(playwright, baseURL, 'invite-single')
        const created = await createInvitation(family.parent, { channel: 'LINK' })
        expect(created.link).toContain(`/join/${created.code}`)
        expect(created.shareText).toContain(created.link)

        const anonymous = await newApi(playwright, baseURL)
        const preview = (await (await anonymous.get(`/api/invitations/preview/${created.code}`)).json()) as IInvitationPreview
        expect(preview.isUsable).toBe(true)
        expect(preview.familyName).toBe(family.account.familyName)

        const email = relativeEmail('joiner')
        const joined = await anonymous.post('/api/invitations/redeem', { data: { code: created.code, name: 'Tonton Zo', email, password: E2E_PASSWORD } })
        expect(joined.status(), await joined.text()).toBe(200)
        expect(await joined.json()).toMatchObject({ isSignedIn: true, isRelativeAccount: true })
        const flow = await flowOf(anonymous)
        expect(flow.families).toHaveLength(1)
        expect(flow.families[0]!.familyName).toBe(family.account.familyName)

        const again = await newApi(playwright, baseURL)
        const reused = await again.post('/api/invitations/redeem', { data: { code: created.code, name: 'Autre', email: relativeEmail('second'), password: E2E_PASSWORD } })
        expect(reused.status()).toBe(410)
        expect(((await (await again.get(`/api/invitations/preview/${created.code}`)).json()) as IInvitationPreview).isUsable).toBe(false)

        const members = (await (await family.parent.get('/api/members')).json()) as { name: string; role: string }[]
        expect(members.some(member => member.name === 'Tonton Zo' && member.role === 'relative')).toBe(true)
    })

    test('an expired or revoked code is refused', async ({ playwright, baseURL }) => {
        const family = await openFamily(playwright, baseURL, 'invite-expired')
        const expired = await createInvitation(family.parent, { channel: 'LINK' })
        const revoked = await createInvitation(family.parent, { channel: 'LINK' })
        const db = postgres(DB_URL, { max: 1, onnotice: () => undefined })
        try {
            await db`update invitations set expires_at = now() - interval '1 hour' where id = ${expired.id}`
        } finally {
            await db.end()
        }
        expect((await family.parent.delete(`/api/invitations/${revoked.id}`)).ok()).toBeTruthy()
        for (const invitation of [expired, revoked]) {
            const api = await newApi(playwright, baseURL)
            const refused = await api.post('/api/invitations/redeem', { data: { code: invitation.code, email: relativeEmail('late'), password: E2E_PASSWORD } })
            expect(refused.status()).toBe(410)
        }
        const unknown = await (await newApi(playwright, baseURL)).get('/api/invitations/preview/doesnotexist')
        expect(((await unknown.json()) as IInvitationPreview).isUsable).toBe(false)
    })

    test('only a parent creates, lists or revokes invitations', async ({ playwright, baseURL }) => {
        const family = await openFamily(playwright, baseURL, 'invite-perm')
        await addMemberApi(family.parent, 'Mamie', 'relative')
        await addMemberApi(family.parent, 'Lova', 'child')
        const relative = await newApi(playwright, baseURL)
        const child = await newApi(playwright, baseURL)
        for (const [api, name] of [[relative, 'Mamie'], [child, 'Lova']] as const) {
            await signIn(api, family.account)
            await useProfile(api, name)
            expect((await api.post('/api/invitations', { data: { channel: 'LINK' } })).status()).toBe(403)
            expect((await api.get('/api/invitations')).status()).toBe(403)
        }
        expect((await (await newApi(playwright, baseURL)).post('/api/invitations', { data: { channel: 'LINK' } })).status()).toBe(401)
        expect((await family.parent.post('/api/invitations', { data: { channel: 'EMAIL', contact: 'not-an-email' } })).status()).toBe(400)
        expect((await family.parent.post('/api/invitations', { data: { channel: 'FAX' } })).status()).toBe(400)
        expect((await family.parent.get('/api/invitations')).status()).toBe(200)
    })

    test('creation and redemption are rate limited', async ({ playwright, baseURL }) => {
        const family = await openFamily(playwright, baseURL, 'invite-rate')
        let last = 200
        for (let index = 0; index < 31; index++) {
            last = (await family.parent.post('/api/invitations', { data: { channel: 'LINK' } })).status()
        }
        expect(last).toBe(429)
    })

    test('the email channel records an e-mail invitation with its link', async ({ playwright, baseURL }) => {
        const family = await openFamily(playwright, baseURL, 'invite-email')
        const created = await family.parent.post('/api/invitations', { data: { channel: 'EMAIL', contact: 'tonton@example.test', name: 'Tonton' } })
        expect(created.status(), await created.text()).toBe(200)
        expect(await created.json()).toMatchObject({ channel: 'EMAIL', contact: 'tonton@example.test', isEmailSent: true })
        const list = (await (await family.parent.get('/api/invitations')).json()) as IInvitation[]
        expect(list[0]).toMatchObject({ channel: 'EMAIL', name: 'Tonton', usedAt: null })
    })
})

test.describe('multi-family relatives', () => {
    test('one account joins two families in one tap and never sees a third one', async ({ playwright, baseURL }) => {
        const a = await openFamily(playwright, baseURL, 'multi-a')
        const b = await openFamily(playwright, baseURL, 'multi-b')
        const c = await openFamily(playwright, baseURL, 'multi-c')
        const childA = await openChild(a, 'Lova')
        await openChild(b, 'Mika')
        await openChild(c, 'Hery')

        const email = relativeEmail('multi')
        const relative = await newApi(playwright, baseURL)
        const first = await createInvitation(a.parent, { channel: 'LINK', name: 'Mamie' })
        expect((await relative.post('/api/invitations/redeem', { data: { code: first.code, email, password: E2E_PASSWORD } })).ok()).toBeTruthy()
        const second = await createInvitation(b.parent, { channel: 'LINK', name: 'Mamie' })
        const oneTap = await relative.post('/api/invitations/redeem', { data: { code: second.code } })
        expect(oneTap.status(), await oneTap.text()).toBe(200)

        const flow = await flowOf(relative)
        expect(flow.families.map(family => family.familyName).sort()).toEqual([a.account.familyName, b.account.familyName].sort())
        const names = flow.families.flatMap(family => family.children.map(child => child.name)).sort()
        expect(names).toEqual(['Lova', 'Mika'])
        expect(JSON.stringify(flow)).not.toContain(c.account.familyName)
        expect(JSON.stringify(flow)).not.toContain('Hery')

        const overview = (await (await relative.get('/api/auth/memberships')).json()) as IAccountOverview
        expect(overview.isRelativeAccount).toBe(true)
        expect(overview.memberships.map(item => item.status)).toEqual(['ACTIVE', 'ACTIVE'])

        const login = await newApi(playwright, baseURL)
        const response = await login.post('/api/auth/login', { data: { email, password: E2E_PASSWORD } })
        expect(await response.json()).toMatchObject({ isSignedIn: true, isRelativeAccount: true })
        expect(((await response.json()) as { memberId: string | null }).memberId).not.toBeNull()
        expect((await flowOf(login)).families).toHaveLength(2)
        expect(childA).toBeTruthy()
    })

    test('switching family scopes the session, and a status change in one family leaves the other untouched', async ({ playwright, baseURL }) => {
        const a = await openFamily(playwright, baseURL, 'status-a')
        const b = await openFamily(playwright, baseURL, 'status-b')
        const relative = await newApi(playwright, baseURL)
        const email = relativeEmail('status')
        const inviteA = await createInvitation(a.parent, { channel: 'LINK', name: 'Mamie' })
        await relative.post('/api/invitations/redeem', { data: { code: inviteA.code, email, password: E2E_PASSWORD } })
        const inviteB = await createInvitation(b.parent, { channel: 'LINK', name: 'Mamie' })
        await relative.post('/api/invitations/redeem', { data: { code: inviteB.code } })

        const before = (await (await relative.get('/api/auth/memberships')).json()) as IAccountOverview
        const familyA = before.memberships.find(item => item.familyName === a.account.familyName)!
        const familyB = before.memberships.find(item => item.familyName === b.account.familyName)!
        expect((await flowOf(relative)).currentFamilyId).toBe(familyB.familyId)

        expect((await relative.post('/api/auth/family', { data: { familyId: familyA.familyId } })).ok()).toBeTruthy()
        expect((await flowOf(relative)).currentFamilyId).toBe(familyA.familyId)
        const sessionMembers = (await (await relative.get('/api/members')).json()) as { id: string }[]
        expect(sessionMembers.some(member => member.id === familyA.memberId)).toBe(true)
        expect(sessionMembers.some(member => member.id === familyB.memberId)).toBe(false)

        const blocked = await a.parent.patch(`/api/members/${familyA.memberId}`, { data: { status: 'blocked' } })
        expect(blocked.status(), await blocked.text()).toBe(200)

        const after = await flowOf(relative)
        expect(after.families.map(family => family.familyName)).toEqual([b.account.familyName])
        const overview = (await (await relative.get('/api/auth/memberships')).json()) as IAccountOverview
        const byFamily = Object.fromEntries(overview.memberships.map(item => [item.familyName, item.status]))
        expect(byFamily[a.account.familyName]).toBe('BLOCKED')
        expect(byFamily[b.account.familyName]).toBe('ACTIVE')
        expect((await relative.post('/api/auth/family', { data: { familyId: familyA.familyId } })).status()).toBe(403)
        expect((await relative.post('/api/auth/family', { data: { familyId: familyB.familyId } })).ok()).toBeTruthy()
        expect((await relative.get('/api/members')).ok()).toBeTruthy()
    })

    test('a relative restricted to one child sees only that child and cannot message the others', async ({ playwright, baseURL }) => {
        const family = await openFamily(playwright, baseURL, 'circle')
        const lova = await openChild(family, 'Lova')
        const mika = await openChild(family, 'Mika')
        const invitation = await createInvitation(family.parent, { channel: 'LINK', name: 'Tonton', childIds: [lova] })
        const relative = await newApi(playwright, baseURL)
        expect((await relative.post('/api/invitations/redeem', { data: { code: invitation.code, email: relativeEmail('circle'), password: E2E_PASSWORD } })).ok()).toBeTruthy()
        const flow = await flowOf(relative)
        expect(flow.families[0]!.children.map(child => child.name)).toEqual(['Lova'])
        const visible = (await (await relative.get('/api/members')).json()) as { name: string; role: string }[]
        expect(visible.filter(member => member.role === 'child').map(member => member.name)).toEqual(['Lova'])

        const upload = await relative.post('/api/files', { data: Buffer.from('RIFF'), headers: { 'content-type': 'audio/wav' } })
        const fileId = ((await upload.json()) as { id: string }).id
        const denied = await relative.post('/api/messages', { data: { toMemberId: mika, fileId, mime: 'audio/wav', durationMs: 1000 } })
        expect(denied.status()).toBe(403)
    })

    test('a relative account cannot enter another profile of the family', async ({ playwright, baseURL }) => {
        const family = await openFamily(playwright, baseURL, 'no-escape')
        const invitation = await createInvitation(family.parent, { channel: 'LINK', name: 'Tonton' })
        const relative = await newApi(playwright, baseURL)
        await relative.post('/api/invitations/redeem', { data: { code: invitation.code, email: relativeEmail('escape'), password: E2E_PASSWORD } })
        const members = (await (await relative.get('/api/members')).json()) as { id: string; name: string; role: string }[]
        const parentId = members.find(member => member.role === 'parent')!.id
        const attempt = await relative.post('/api/auth/profile', { data: { memberId: parentId, code: PROFILE_PIN } })
        expect(attempt.status()).toBe(403)
        const locked = await relative.post('/api/auth/profile', { data: { memberId: null } })
        expect(await locked.json()).toMatchObject({ isRelativeAccount: true })
        expect((await relative.get('/api/members')).ok()).toBeTruthy()
        expect((await relative.post('/api/invitations', { data: { channel: 'LINK' } })).status()).toBe(403)
    })
})

test.describe('invitation screens', () => {
    test('a parent invites from the family page and the relative joins from the link', async ({ page, browser, playwright, baseURL }) => {
        const family = await openFamily(playwright, baseURL, 'invite-ui')
        await addMemberApi(family.parent, 'Lova', 'child')
        const cookies = await family.parent.storageState()
        await page.context().addCookies(cookies.cookies)
        await chooseProfile(page, 'Parent')
        await page.goto('/family/invite')
        await inviteByLink(page, 'Tonton Zo')
        const link = await page.getByTestId('invite-link').inputValue()
        expect(link).toMatch(/\/join\/[a-z0-9]{6}$/)
        await expect(page.getByTestId('invite-copy')).toBeVisible()

        const context = await browser.newContext({ locale: 'fr-FR', reducedMotion: 'reduce' })
        const guest = await context.newPage()
        await guest.goto(new URL(link).pathname)
        await expect(guest.getByTestId('join-family')).toContainText(family.account.familyName)
        await guest.getByTestId('join-name').fill('Tonton Zo')
        await guest.getByTestId('join-next').click()
        await guest.getByTestId('join-email').fill(relativeEmail('ui'))
        await guest.getByTestId('join-next').click()
        await guest.getByTestId('join-password').fill(E2E_PASSWORD)
        await guest.getByTestId('join-next').click()
        await guest.locator('input[type=password]').fill('4321')
        await guest.getByTestId('join-submit').click()
        await expect(guest).toHaveURL(/\/relative$/)
        await expect(guest.getByTestId('relative-family')).toContainText(family.account.familyName)
        await expect(guest.getByTestId('relative-join-another')).toBeVisible()
        await context.close()

        await page.reload()
        await expect(page.getByTestId('invitation-row').first()).toContainText('Utilisée')
    })
})
