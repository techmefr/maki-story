import { expect, test } from '@playwright/test'
import type { APIRequestContext, Playwright } from '@playwright/test'
import { chooseProfile, PARENT_NAME, PROFILE_PIN, signIn, uniqueAccount, useProfile } from './helpers'
import type { IE2eAccount } from './helpers'

interface IAccessReply {
    isAllowed: boolean
    reason: string | null
    homework: string
    nightStartsAt: string | null
}

interface IPendingItem {
    id: string
    kind: string
}

const MS_PER_HOUR = 3_600_000
const MS_PER_MINUTE = 60_000

const clock = (offsetHours: number): string => {
    const date = new Date(Date.now() + offsetHours * MS_PER_HOUR)
    return `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`
}

const controls = (patch: Record<string, unknown> = {}) => ({
    night: { isEnabled: false, from: '21:00', to: '07:00' },
    listening: { isEnabled: false, from: '08:00', to: '19:00' },
    homework: { isEnabled: false, from: '16:00', to: '19:00' },
    isApprovalEnabled: false,
    timezone: 'UTC',
    ...patch,
})

const openSession = async (playwright: Playwright, baseURL: string | undefined, account: IE2eAccount): Promise<APIRequestContext> => {
    const api = await playwright.request.newContext({ baseURL })
    await signIn(api, account)
    return api
}

const setup = async (playwright: Playwright, baseURL: string | undefined, label: string) => {
    const account = uniqueAccount(label)
    const parent = await openSession(playwright, baseURL, account)
    await useProfile(parent, PARENT_NAME)
    const created = await parent.post('/api/members', { data: { name: 'Lova', role: 'child', color: 'sky', code: { kind: 'pin', value: PROFILE_PIN } } })
    const childId = ((await created.json()) as { id: string }).id
    const signChildIn = async (): Promise<APIRequestContext> => {
        const child = await openSession(playwright, baseURL, account)
        expect((await child.post('/api/auth/profile', { data: { memberId: childId, code: PROFILE_PIN } })).ok()).toBeTruthy()
        return child
    }
    return { parent, childId, signChildIn }
}

const access = async (api: APIRequestContext): Promise<IAccessReply> => (await (await api.get('/api/access')).json()) as IAccessReply

const pending = async (api: APIRequestContext): Promise<IPendingItem[]> => ((await (await api.get('/api/homework/requests')).json()) as { items: IPendingItem[] }).items

const saveControls = (api: APIRequestContext, childId: string, value: object) => api.put(`/api/members/${childId}/access-controls`, { data: value })

const decide = (api: APIRequestContext, id: string, decision: 'approved' | 'refused') => api.post(`/api/homework/requests/${id}`, { data: { decision } })

test.describe('night mode, time ranges and sign-in approval', () => {
    test('stays off by default and only parents can read or change the rules', async ({ playwright, baseURL }) => {
        const { parent, childId, signChildIn } = await setup(playwright, baseURL, 'controls-off')
        const child = await signChildIn()
        expect(await access(child)).toMatchObject({ isAllowed: true, reason: null, nightStartsAt: null })
        const loaded = await parent.get(`/api/members/${childId}/access-controls`)
        expect(await loaded.json()).toMatchObject({ isApprovalEnabled: false, night: { isEnabled: false }, listening: { isEnabled: false } })
        expect((await child.get(`/api/members/${childId}/access-controls`)).status()).toBe(403)
        expect((await saveControls(child, childId, controls())).status()).toBe(403)
        expect((await child.post('/api/access/request')).status()).toBe(400)
        await parent.dispose()
        await child.dispose()
    })

    test('rejects invalid ranges', async ({ playwright, baseURL }) => {
        const { parent, childId } = await setup(playwright, baseURL, 'controls-invalid')
        expect((await saveControls(parent, childId, controls({ night: { isEnabled: true, from: '07:00', to: '07:00' } }))).status()).toBe(400)
        expect((await saveControls(parent, childId, controls({ listening: { isEnabled: true, from: '25:00', to: '07:00' } }))).status()).toBe(400)
        expect((await saveControls(parent, childId, controls({ timezone: 'Nowhere/Land' }))).status()).toBe(400)
        await parent.dispose()
    })

    test('night mode locks the child and the first parent answer wins on an exception', async ({ playwright, baseURL }) => {
        const { parent, childId, signChildIn } = await setup(playwright, baseURL, 'controls-night')
        const child = await signChildIn()
        expect((await saveControls(parent, childId, controls({ night: { isEnabled: true, from: clock(-1), to: clock(1) } }))).ok()).toBeTruthy()
        expect(await access(child)).toMatchObject({ isAllowed: false, reason: 'night', homework: 'none' })
        expect((await child.get('/api/books')).status()).toBe(403)

        expect((await child.post('/api/access/request')).ok()).toBeTruthy()
        expect((await child.post('/api/access/request')).ok()).toBeTruthy()
        expect(await access(child)).toMatchObject({ isAllowed: false, reason: 'night', homework: 'pending' })
        const requests = await pending(parent)
        expect(requests).toHaveLength(1)
        expect(requests[0]!.kind).toBe('exception')

        expect((await decide(parent, requests[0]!.id, 'approved')).ok()).toBeTruthy()
        expect((await decide(parent, requests[0]!.id, 'refused')).status()).toBe(409)
        expect((await access(child)).isAllowed).toBe(true)
        expect((await child.get('/api/books')).ok()).toBeTruthy()
        await parent.dispose()
        await child.dispose()
    })

    test('a refused child may retry once per slot and then stays refused', async ({ playwright, baseURL }) => {
        const { parent, childId, signChildIn } = await setup(playwright, baseURL, 'controls-retry')
        const child = await signChildIn()
        expect((await saveControls(parent, childId, controls({ listening: { isEnabled: true, from: clock(2), to: clock(3) } }))).ok()).toBeTruthy()
        expect(await access(child)).toMatchObject({ isAllowed: false, reason: 'listening' })

        expect((await child.post('/api/access/request')).ok()).toBeTruthy()
        const [first] = await pending(parent)
        expect((await decide(parent, first!.id, 'refused')).ok()).toBeTruthy()
        expect(await access(child)).toMatchObject({ isAllowed: false, homework: 'refused' })

        expect((await child.post('/api/access/request')).ok()).toBeTruthy()
        const [second] = await pending(parent)
        expect(second).toBeDefined()
        expect((await decide(parent, second!.id, 'refused')).ok()).toBeTruthy()

        expect((await child.post('/api/access/request')).ok()).toBeTruthy()
        expect(await pending(parent)).toHaveLength(0)
        expect(await access(child)).toMatchObject({ isAllowed: false, homework: 'refused' })
        await parent.dispose()
        await child.dispose()
    })

    test('the night countdown is announced before night mode starts', async ({ playwright, baseURL }) => {
        const { parent, childId, signChildIn } = await setup(playwright, baseURL, 'controls-countdown')
        const child = await signChildIn()
        expect((await saveControls(parent, childId, controls({ night: { isEnabled: true, from: clock(0.25), to: clock(8) } }))).ok()).toBeTruthy()
        const reply = await access(child)
        expect(reply.isAllowed).toBe(true)
        const minutes = (Date.parse(reply.nightStartsAt!) - Date.now()) / MS_PER_MINUTE
        expect(minutes).toBeGreaterThan(10)
        expect(minutes).toBeLessThanOrEqual(16)
        await parent.dispose()
        await child.dispose()
    })

    test('homework follow-up only applies inside the homework range', async ({ playwright, baseURL }) => {
        const { parent, childId, signChildIn } = await setup(playwright, baseURL, 'controls-homework-range')
        const child = await signChildIn()
        expect((await parent.put(`/api/members/${childId}/homework-follow`, { data: { isEnabled: true } })).ok()).toBeTruthy()
        expect((await saveControls(parent, childId, controls({ homework: { isEnabled: true, from: clock(2), to: clock(3) } }))).ok()).toBeTruthy()
        expect((await access(child)).isAllowed).toBe(true)
        expect((await saveControls(parent, childId, controls({ homework: { isEnabled: true, from: clock(-1), to: clock(1) } }))).ok()).toBeTruthy()
        expect(await access(child)).toMatchObject({ isAllowed: false, reason: 'homework' })
        await parent.dispose()
        await child.dispose()
    })

    test('sign-in approval waits for a parent and lasts one session', async ({ playwright, baseURL }) => {
        const { parent, childId, signChildIn } = await setup(playwright, baseURL, 'controls-approval')
        expect((await saveControls(parent, childId, controls({ isApprovalEnabled: true }))).ok()).toBeTruthy()

        const child = await signChildIn()
        expect(await access(child)).toMatchObject({ isAllowed: false, reason: 'approval', homework: 'pending' })
        expect((await child.get('/api/books')).status()).toBe(403)
        const requests = await pending(parent)
        expect(requests).toHaveLength(1)
        expect(requests[0]!.kind).toBe('signin')

        expect((await decide(parent, requests[0]!.id, 'approved')).ok()).toBeTruthy()
        expect((await access(child)).isAllowed).toBe(true)
        expect((await child.get('/api/books')).ok()).toBeTruthy()

        const nextSession = await signChildIn()
        expect(await access(nextSession)).toMatchObject({ isAllowed: false, reason: 'approval' })
        const [again] = await pending(parent)
        expect((await decide(parent, again!.id, 'refused')).ok()).toBeTruthy()
        expect(await access(nextSession)).toMatchObject({ isAllowed: false, reason: 'approval', homework: 'refused' })

        expect((await saveControls(parent, childId, controls())).ok()).toBeTruthy()
        expect((await access(nextSession)).isAllowed).toBe(true)
        await parent.dispose()
        await child.dispose()
        await nextSession.dispose()
    })
})

test.describe('time rules in the app', () => {
    test('a parent sets the night mode in the child parental control and it is kept', async ({ page }) => {
        const account = uniqueAccount('controls-form-ui')
        await signIn(page.request, account)
        await chooseProfile(page, PARENT_NAME)
        const created = await page.request.post('/api/members', { data: { name: 'Lova', role: 'child', color: 'sky', code: { kind: 'pin', value: PROFILE_PIN } } })
        expect(created.ok()).toBeTruthy()
        await page.goto('/family/parental')
        const card = page.getByTestId('access-controls')
        await expect(card).toBeVisible()
        await expect(page.getByTestId('controls-night-from')).toHaveCount(0)
        await page.getByTestId('controls-night-enabled').check()
        await page.getByTestId('controls-night-from').fill('20:30')
        await page.getByTestId('controls-night-to').fill('06:45')
        await page.getByTestId('controls-approval-enabled').check()
        await page.getByTestId('controls-save').click()
        await expect(page.getByTestId('controls-save')).toContainText('Enregistré')
        await page.reload()
        await expect(page.getByTestId('controls-night-from')).toHaveValue('20:30')
        await expect(page.getByTestId('controls-night-to')).toHaveValue('06:45')
        await expect(page.getByTestId('controls-approval-enabled')).toBeChecked()
    })

    test('the child asks for an exception at night and a parent answers', async ({ page, playwright, baseURL }) => {
        const account = uniqueAccount('controls-locked-ui')
        await signIn(page.request, account)
        const parent = await openSession(playwright, baseURL, account)
        await useProfile(parent, PARENT_NAME)
        const created = await parent.post('/api/members', { data: { name: 'Lova', role: 'child', color: 'sky', code: { kind: 'pin', value: PROFILE_PIN } } })
        const childId = ((await created.json()) as { id: string }).id
        expect((await saveControls(parent, childId, controls({ night: { isEnabled: true, from: clock(-1), to: clock(1) } }))).ok()).toBeTruthy()

        await chooseProfile(page, 'Lova')
        await expect(page).toHaveURL(/\/kid\/locked/)
        await page.getByTestId('exception-ask').click()
        await expect(page.getByTestId('homework-state')).toContainText('prévenu tes parents')
        const [request] = await pending(parent)
        expect(request!.kind).toBe('exception')
        expect((await decide(parent, request!.id, 'refused')).ok()).toBeTruthy()
        await expect(page.getByTestId('homework-ask-again')).toBeVisible({ timeout: 15_000 })
        await page.getByTestId('homework-ask-again').click()
        const [retry] = await pending(parent)
        expect((await decide(parent, retry!.id, 'approved')).ok()).toBeTruthy()
        await expect(page).toHaveURL(/\/kid$/, { timeout: 15_000 })
        await parent.dispose()
    })
})
