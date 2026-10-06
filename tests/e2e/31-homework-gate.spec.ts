import { expect, test } from '@playwright/test'
import type { APIRequestContext, Playwright } from '@playwright/test'
import { PARENT_NAME, PROFILE_PIN, signIn, uniqueAccount, useProfile } from './helpers'
import type { IE2eAccount } from './helpers'

interface IAccessReply {
    isAllowed: boolean
    reason: string | null
    homework: string
    overrideUntil: string | null
}

interface IPendingReply {
    items: { id: string; childId: string }[]
}

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
    const child = await openSession(playwright, baseURL, account)
    expect((await child.post('/api/auth/profile', { data: { memberId: childId, code: PROFILE_PIN } })).ok()).toBeTruthy()
    return { parent, child, childId }
}

const access = async (api: APIRequestContext): Promise<IAccessReply> => (await (await api.get('/api/access')).json()) as IAccessReply

const pending = async (api: APIRequestContext): Promise<IPendingReply['items']> => ((await (await api.get('/api/homework/requests')).json()) as IPendingReply).items

test.describe('homework access gate', () => {
    test('stays off by default and refuses requests when follow-up is disabled', async ({ playwright, baseURL }) => {
        const { parent, child } = await setup(playwright, baseURL, 'homework-off')
        expect(await access(child)).toMatchObject({ isAllowed: true, homework: 'none' })
        expect((await child.post('/api/access/homework')).status()).toBe(400)
        await parent.dispose()
        await child.dispose()
    })

    test('a child waits, a parent approves, and the answer of the first parent wins', async ({ playwright, baseURL }) => {
        const { parent, child, childId } = await setup(playwright, baseURL, 'homework-approve')
        expect((await parent.put(`/api/members/${childId}/homework-follow`, { data: { isEnabled: true } })).ok()).toBeTruthy()
        expect(await access(child)).toMatchObject({ isAllowed: false, reason: 'homework', homework: 'none' })
        expect((await child.get('/api/books')).status()).toBe(403)

        expect((await child.post('/api/access/homework')).ok()).toBeTruthy()
        expect((await child.post('/api/access/homework')).ok()).toBeTruthy()
        expect(await access(child)).toMatchObject({ isAllowed: false, homework: 'pending' })
        const requests = await pending(parent)
        expect(requests).toHaveLength(1)

        expect((await child.post(`/api/homework/requests/${requests[0]!.id}`, { data: { decision: 'approved' } })).status()).toBe(403)
        expect((await parent.post(`/api/homework/requests/${requests[0]!.id}`, { data: { decision: 'approved' } })).ok()).toBeTruthy()
        expect((await parent.post(`/api/homework/requests/${requests[0]!.id}`, { data: { decision: 'refused' } })).status()).toBe(409)

        const approved = await access(child)
        expect(approved.isAllowed).toBe(true)
        expect(Date.parse(approved.overrideUntil!)).toBeGreaterThan(Date.now())
        expect((await child.get('/api/books')).ok()).toBeTruthy()
        expect(await pending(parent)).toHaveLength(0)
        await parent.dispose()
        await child.dispose()
    })

    test('a refusal keeps the child locked with the refused state until a new request', async ({ playwright, baseURL }) => {
        const { parent, child, childId } = await setup(playwright, baseURL, 'homework-refuse')
        expect((await parent.put(`/api/members/${childId}/homework-follow`, { data: { isEnabled: true } })).ok()).toBeTruthy()
        expect((await child.post('/api/access/homework')).ok()).toBeTruthy()
        const [request] = await pending(parent)
        expect((await parent.post(`/api/homework/requests/${request!.id}`, { data: { decision: 'refused' } })).ok()).toBeTruthy()
        expect(await access(child)).toMatchObject({ isAllowed: false, reason: 'homework', homework: 'refused' })

        expect((await child.post('/api/access/homework')).ok()).toBeTruthy()
        expect(await access(child)).toMatchObject({ isAllowed: false, homework: 'pending' })

        expect((await parent.put(`/api/members/${childId}/homework-follow`, { data: { isEnabled: false } })).ok()).toBeTruthy()
        expect((await access(child)).isAllowed).toBe(true)
        await parent.dispose()
        await child.dispose()
    })
})
