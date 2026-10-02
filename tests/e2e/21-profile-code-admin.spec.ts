import { expect, test } from '@playwright/test'
import type { APIRequestContext, Playwright } from '@playwright/test'
import postgres from 'postgres'
import { CHILD_SYMBOLS, chooseProfile, enterPin, enterSymbols, PARENT_NAME, PROFILE_PIN, signIn, uniqueAccount, useProfile } from './helpers'
import type { IE2eAccount } from './helpers'

const DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgresql://tantara@localhost:5544/tantara_e2e'

const pin = (value: string): object => ({ kind: 'pin', value })

const openSession = async (playwright: Playwright, baseURL: string | undefined, account: IE2eAccount): Promise<APIRequestContext> => {
    const api = await playwright.request.newContext({ baseURL })
    await signIn(api, account)
    return api
}

const createMember = async (api: APIRequestContext, name: string, role: string, code?: object): Promise<string> => {
    const response = await api.post('/api/members', { data: { name, role, color: 'coral', code } })
    expect(response.ok()).toBeTruthy()
    return ((await response.json()) as { id: string }).id
}

const auditActions = async (targetId: string): Promise<string[]> => {
    const db = postgres(DATABASE_URL, { max: 1, onnotice: () => undefined })
    try {
        const rows = await db<{ action: string }[]>`select action from audit_log where target_member_id = ${targetId} order by created_at`
        return rows.map(row => row.action)
    } finally {
        await db.end()
    }
}

test.describe('member code administration', () => {
    test('a parent sets, changes, removes a code and clears a lockout, with an audit trail', async ({ playwright, baseURL }) => {
        const account = uniqueAccount('code-admin')
        const parent = await openSession(playwright, baseURL, account)
        const parentId = await useProfile(parent, PARENT_NAME)
        const childId = await createMember(parent, 'Lova', 'child', pin('135790'))
        const otherParentId = await createMember(parent, 'Papa', 'parent', pin('246801'))

        const child = await openSession(playwright, baseURL, account)
        for (let tries = 0; tries < 4; tries++) {
            expect((await child.post('/api/auth/profile', { data: { memberId: childId, code: '0000' } })).status()).toBe(403)
        }
        expect((await child.post('/api/auth/profile', { data: { memberId: childId, code: '0000' } })).status()).toBe(429)
        expect((await child.post('/api/auth/profile', { data: { memberId: childId, code: '135790' } })).status()).toBe(429)
        const lockedMembers = (await (await parent.get('/api/members')).json()) as { id: string; isCodeLocked?: boolean }[]
        expect(lockedMembers.find(member => member.id === childId)?.isCodeLocked).toBe(true)

        expect((await parent.post(`/api/members/${childId}/code-unlock`)).ok()).toBeTruthy()
        expect((await child.post('/api/auth/profile', { data: { memberId: childId, code: '135790' } })).ok()).toBeTruthy()

        expect((await parent.put(`/api/members/${childId}/code`, { data: { kind: 'symbols', value: '0213' } })).ok()).toBeTruthy()
        expect((await parent.put(`/api/members/${otherParentId}/code`, { data: pin('999999') })).ok()).toBeTruthy()
        expect((await parent.delete(`/api/members/${childId}/code`)).ok()).toBeTruthy()
        const members = (await (await parent.get('/api/members')).json()) as { id: string; hasCode: boolean }[]
        expect(members.find(member => member.id === childId)?.hasCode).toBe(false)
        expect((await child.post('/api/auth/profile', { data: { memberId: childId, code: '135790' } })).status()).toBe(403)

        expect((await parent.delete(`/api/members/${parentId}/code`)).status()).toBe(403)
        expect(await auditActions(childId)).toEqual(['member.code.unlocked', 'member.code.set', 'member.code.removed'])
        await parent.dispose()
        await child.dispose()
    })

    test('a child or a relative cannot administer codes', async ({ playwright, baseURL }) => {
        const account = uniqueAccount('code-admin-denied')
        const parent = await openSession(playwright, baseURL, account)
        await useProfile(parent, PARENT_NAME)
        const childId = await createMember(parent, 'Lova', 'child', pin('135790'))
        const relativeId = await createMember(parent, 'Mamie', 'relative', pin('246801'))

        const child = await openSession(playwright, baseURL, account)
        expect((await child.post('/api/auth/profile', { data: { memberId: childId, code: '135790' } })).ok()).toBeTruthy()
        expect((await child.delete(`/api/members/${relativeId}/code`)).status()).toBe(403)
        expect((await child.post(`/api/members/${relativeId}/code-unlock`)).status()).toBe(403)

        const relative = await openSession(playwright, baseURL, account)
        expect((await relative.post('/api/auth/profile', { data: { memberId: relativeId, code: '246801' } })).ok()).toBeTruthy()
        expect((await relative.delete(`/api/members/${childId}/code`)).status()).toBe(403)
        expect((await relative.post(`/api/members/${childId}/code-unlock`)).status()).toBe(403)
        expect((await relative.put(`/api/members/${childId}/code`, { data: pin('777888') })).status()).toBe(403)
        await parent.dispose()
        await child.dispose()
        await relative.dispose()
    })

    test('the family screen lets a parent unlock, remove and set a child code', async ({ page }) => {
        await signIn(page.request, uniqueAccount('code-admin-ui'))
        await chooseProfile(page, PARENT_NAME)
        const childId = await createMember(page.request, 'Lova', 'child', pin('135790'))
        for (let tries = 0; tries < 5; tries++) {
            const attempt = await page.request.post('/api/auth/profile', { data: { memberId: childId, code: '0000' } })
            expect([403, 429]).toContain(attempt.status())
        }
        await page.goto(`/family/${childId}`)
        await expect(page.getByTestId('code-state')).toHaveText('Profil bloqué après trop d’essais.')
        await page.getByRole('button', { name: 'Débloquer le profil' }).click()
        await expect(page.getByTestId('code-state')).toHaveText('Code en chiffres défini.')
        page.once('dialog', dialog => dialog.accept())
        await page.getByRole('button', { name: 'Retirer le code' }).click()
        await expect(page.getByTestId('code-state')).toHaveText('Aucun code défini.')
        await page.getByRole('button', { name: 'Définir le code' }).click()
        await enterSymbols(page, CHILD_SYMBOLS)
        await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
        await expect(page).toHaveURL(/\/family$/)
        await page.goto(`/family/${childId}`)
        await expect(page.getByTestId('code-state')).toHaveText('Code en symboles défini.')
    })
})

test.describe('cold start', () => {
    test('opens on the profile selection screen instead of restoring the active profile', async ({ page }) => {
        await signIn(page.request, uniqueAccount('cold-start'))
        await useProfile(page.request, PARENT_NAME)
        await page.goto('/home')
        await expect(page).toHaveURL(/\/profiles/)
        await expect(page.getByRole('heading', { name: 'Qui écoute ?' })).toBeVisible()
        const state = (await (await page.request.get('/api/auth/me')).json()) as { memberId: string | null }
        expect(state.memberId).toBeNull()
        await page.locator('button.card', { hasText: PARENT_NAME }).first().click()
        await enterPin(page, PROFILE_PIN)
        await expect(page).toHaveURL(/\/home/)
    })
})
