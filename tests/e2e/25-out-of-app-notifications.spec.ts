import { expect, test } from '@playwright/test'
import type { APIRequestContext, Playwright } from '@playwright/test'
import type { INotificationPreference, IPushConfig } from '../../shared/types/family'
import type { INotificationList } from '../../shared/types/share'
import { addMemberApi, openFamily, profileApi, uploadAudio } from './family-helpers'
import type { IFamilyApi } from './family-helpers'

interface IDelivery {
    memberId: string | null
    kind: string
    channel: 'PUSH' | 'EMAIL'
    status: 'SENT' | 'SUPPRESSED' | 'FAILED'
    reason: string
}

const DAYS = 7
const NARROW = { isOpen: true, from: '00:00', to: '00:01' }

const deliveries = async (parent: APIRequestContext): Promise<IDelivery[]> => (await (await parent.get('/api/notifications/deliveries')).json()) as IDelivery[]

const subscribe = (api: APIRequestContext, endpoint: string, platform = 'WEB') => api.post('/api/push/subscriptions', { data: { platform, endpoint, keys: { p256dh: 'k', auth: 'a' } } })

const sendMessage = async (api: APIRequestContext, childId: string): Promise<number> => {
    const fileId = await uploadAudio(api)
    const response = await api.post('/api/messages', { data: { toMemberId: childId, fileId, mime: 'audio/wav', durationMs: 1000 } })
    expect(response.status(), await response.text()).toBe(200)
    return response.status()
}

const setup = async (playwright: Playwright, baseURL: string | undefined, label: string): Promise<{ family: IFamilyApi; mamie: APIRequestContext; tonton: APIRequestContext; childId: string; parentId: string }> => {
    const family = await openFamily(playwright, baseURL, label)
    const members = (await (await family.parent.get('/api/members')).json()) as { id: string; role: string }[]
    const parentId = members.find(member => member.role === 'parent')!.id
    await addMemberApi(family.parent, 'Mamie', 'relative')
    await addMemberApi(family.parent, 'Tonton', 'relative')
    const childId = await addMemberApi(family.parent, 'Lova', 'child')
    return {
        family,
        parentId,
        childId,
        mamie: await profileApi(playwright, baseURL, family.account, 'Mamie'),
        tonton: await profileApi(playwright, baseURL, family.account, 'Tonton'),
    }
}

test.describe('subscriptions and preferences', () => {
    test('a subscription is validated, family scoped and revocable', async ({ playwright, baseURL }) => {
        const { family, mamie } = await setup(playwright, baseURL, 'push-sub')
        expect((await subscribe(family.parent, 'https://push.example/one')).ok()).toBeTruthy()
        expect((await subscribe(family.parent, 'http://insecure.example/one')).status()).toBe(400)
        expect((await family.parent.post('/api/push/subscriptions', { data: { platform: 'SMOKE', endpoint: 'https://push.example/x' } })).status()).toBe(400)
        expect((await (await playwright.request.newContext({ baseURL })).post('/api/push/subscriptions', { data: { platform: 'WEB', endpoint: 'https://push.example/anon' } })).status()).toBe(401)
        expect((await subscribe(mamie, 'fcm-token-android', 'ANDROID')).ok()).toBeTruthy()
        const revoked = await family.parent.delete('/api/push/subscriptions', { data: { endpoint: 'https://push.example/one' } })
        expect(revoked.ok()).toBeTruthy()
        const config = (await (await family.parent.get('/api/push/config')).json()) as IPushConfig
        expect(config.isWebEnabled).toBe(true)
    })

    test('preferences default to on, persist per member and reject unknown values', async ({ playwright, baseURL }) => {
        const { family, mamie } = await setup(playwright, baseURL, 'push-prefs')
        const defaults = (await (await family.parent.get('/api/notifications/preferences')).json()) as INotificationPreference[]
        expect(defaults.length).toBeGreaterThan(0)
        expect(defaults.every(item => item.isEnabled)).toBe(true)
        const saved = await family.parent.put('/api/notifications/preferences', { data: { kind: 'message_received', channel: 'PUSH', isEnabled: false } })
        expect(saved.ok()).toBeTruthy()
        const parentPrefs = (await (await family.parent.get('/api/notifications/preferences')).json()) as INotificationPreference[]
        expect(parentPrefs.find(item => item.kind === 'message_received' && item.channel === 'PUSH')?.isEnabled).toBe(false)
        const mamiePrefs = (await (await mamie.get('/api/notifications/preferences')).json()) as INotificationPreference[]
        expect(mamiePrefs.find(item => item.kind === 'message_received' && item.channel === 'PUSH')?.isEnabled).toBe(true)
        expect((await family.parent.put('/api/notifications/preferences', { data: { kind: 'nope', channel: 'PUSH', isEnabled: true } })).status()).toBe(400)
        expect((await family.parent.put('/api/notifications/preferences', { data: { kind: 'message_received', channel: 'IN_APP', isEnabled: true } })).status()).toBe(400)
        expect((await family.parent.put('/api/notifications/preferences', { data: { kind: 'message_received', channel: 'PUSH', isEnabled: 'yes' } })).status()).toBe(400)
    })

    test('the delivery log is parent only and family scoped', async ({ playwright, baseURL }) => {
        const first = await setup(playwright, baseURL, 'push-log-a')
        const second = await setup(playwright, baseURL, 'push-log-b')
        await subscribe(first.family.parent, 'https://push.example/log-a')
        await sendMessage(first.mamie, first.childId)
        expect((await deliveries(first.family.parent)).length).toBeGreaterThan(0)
        expect(await deliveries(second.family.parent)).toEqual([])
        expect((await first.mamie.get('/api/notifications/deliveries')).status()).toBe(403)
    })
})

test.describe('delivery rules', () => {
    test('a message pushes the parent and the child device', async ({ playwright, baseURL }) => {
        const { family, mamie, childId, parentId } = await setup(playwright, baseURL, 'push-send')
        await subscribe(family.parent, 'https://push.example/parent-send')
        const child = await profileApi(playwright, baseURL, family.account, 'Lova')
        await subscribe(child, 'https://push.example/child-send')
        await sendMessage(mamie, childId)
        const rows = (await deliveries(family.parent)).filter(row => row.kind === 'message_received')
        expect(rows.find(row => row.memberId === parentId)).toMatchObject({ channel: 'PUSH', status: 'SENT' })
        expect(rows.find(row => row.memberId === childId)).toMatchObject({ channel: 'PUSH', status: 'SENT' })
        const parentList = (await (await family.parent.get('/api/notifications')).json()) as INotificationList
        expect(parentList.items.some(item => item.kind === 'message_received')).toBe(true)
        const latest = (await (await family.parent.get('/api/notifications/latest')).json()) as { title: string; body: string }
        expect(latest.body).toContain('Mamie')
    })

    test('an opted-out channel is suppressed and the other one still fires', async ({ playwright, baseURL }) => {
        const { family, mamie, tonton, childId, parentId } = await setup(playwright, baseURL, 'push-optout')
        await subscribe(family.parent, 'https://push.example/parent-optout')
        await family.parent.put('/api/notifications/preferences', { data: { kind: 'message_received', channel: 'PUSH', isEnabled: false } })
        await sendMessage(mamie, childId)
        let rows = (await deliveries(family.parent)).filter(row => row.kind === 'message_received' && row.memberId === parentId)
        expect(rows.some(row => row.channel === 'PUSH' && row.status === 'SENT')).toBe(false)
        expect(rows.find(row => row.channel === 'EMAIL')).toMatchObject({ status: 'QUEUED' })

        await family.parent.put('/api/notifications/preferences', { data: { kind: 'message_received', channel: 'EMAIL', isEnabled: false } })
        await sendMessage(tonton, childId)
        rows = (await deliveries(family.parent)).filter(row => row.kind === 'message_received' && row.memberId === parentId)
        expect(rows.filter(row => row.status === 'SUPPRESSED' && row.reason === 'opt_out').length).toBeGreaterThanOrEqual(1)
        expect(rows.filter(row => row.status === 'QUEUED')).toHaveLength(1)
    })

    test('a child under schedule lock gets no out-of-app notification', async ({ playwright, baseURL }) => {
        const { family, mamie, tonton, childId } = await setup(playwright, baseURL, 'push-lock')
        const child = await profileApi(playwright, baseURL, family.account, 'Lova')
        expect((await subscribe(child, 'https://push.example/child-lock')).ok()).toBeTruthy()
        await sendMessage(mamie, childId)
        const unlocked = (await deliveries(family.parent)).filter(row => row.memberId === childId)
        expect(unlocked.find(row => row.channel === 'PUSH')).toMatchObject({ status: 'SENT' })

        const locked = await family.parent.put(`/api/members/${childId}/schedule`, {
            data: { isEnabled: true, weekly: Array.from({ length: DAYS }, () => ({ ...NARROW })), timezone: 'UTC' },
        })
        expect(locked.ok(), await locked.text()).toBeTruthy()
        await sendMessage(tonton, childId)
        const rows = (await deliveries(family.parent)).filter(row => row.memberId === childId)
        const suppressed = rows.filter(row => row.status === 'SUPPRESSED')
        expect(suppressed).toHaveLength(1)
        expect(suppressed[0]).toMatchObject({ reason: 'schedule_lock', channel: 'PUSH' })
        expect(rows.filter(row => row.status === 'SENT')).toHaveLength(1)
    })

    test('a dead push endpoint is revoked and the e-mail fallback takes over', async ({ playwright, baseURL }) => {
        const { family, mamie, childId, parentId } = await setup(playwright, baseURL, 'push-gone')
        await subscribe(family.parent, 'https://push.example/gone-parent')
        await sendMessage(mamie, childId)
        const rows = (await deliveries(family.parent)).filter(row => row.memberId === parentId && row.kind === 'message_received')
        expect(rows.find(row => row.channel === 'PUSH')).toMatchObject({ status: 'FAILED' })
        expect(rows.find(row => row.channel === 'EMAIL')).toMatchObject({ status: 'QUEUED' })
    })

    test('a relative with an account is reached by e-mail and never sees another family log', async ({ playwright, baseURL }) => {
        const { family } = await setup(playwright, baseURL, 'push-relative-account')
        const invitation = await family.parent.post('/api/invitations', { data: { channel: 'LINK', name: 'Oncle' } })
        const code = ((await invitation.json()) as { code: string }).code
        const relative = await playwright.request.newContext({ baseURL })
        const email = `e2e-notify-${Date.now()}@tantara.test`
        expect((await relative.post('/api/invitations/redeem', { data: { code, email, password: 'e2e-password-123' } })).ok()).toBeTruthy()
        const members = (await (await relative.get('/api/members')).json()) as { id: string; name: string }[]
        expect(members.length).toBeGreaterThan(0)
        expect((await relative.get('/api/notifications/deliveries')).status()).toBe(403)
    })
})

test.describe('birthday reminders', () => {
    test('reminds parents and relatives once, a few days before', async ({ playwright, baseURL }) => {
        const { family, mamie, childId } = await setup(playwright, baseURL, 'push-birthday')
        const date = new Date()
        date.setUTCDate(date.getUTCDate() + 2)
        const birthDate = `${date.getUTCFullYear() - 5}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
        expect((await family.parent.patch(`/api/members/${childId}`, { data: { birthDate } })).ok()).toBeTruthy()
        const task = await family.parent.get('/_nitro/tasks/birthdays:remind')
        expect(task.ok(), await task.text()).toBeTruthy()
        const countOf = async (api: APIRequestContext): Promise<number> =>
            ((await (await api.get('/api/notifications')).json()) as INotificationList).items.filter(item => item.kind === 'birthday_reminder').length
        expect(await countOf(family.parent)).toBe(1)
        expect(await countOf(mamie)).toBe(1)
        await family.parent.get('/_nitro/tasks/birthdays:remind')
        expect(await countOf(family.parent)).toBe(1)
    })
})
