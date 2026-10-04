import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { PARENT_NAME, PROFILE_PIN, signIn, uniqueAccount, unlockProfile, useProfile } from './helpers'
import type { IApiMember } from './helpers'

interface IDeviceBody {
    id: string
    secret: string
}

const ENROL_HEADING = 'Activer l’empreinte ou le visage ?'
const UNLOCK_BUTTON = 'Utiliser l’empreinte ou le visage'

test.skip(Boolean(process.env.E2E_BASE_URL), 'needs the biometric test bridge of the local test server')

const installBridge = async (page: Page, options: { isDenied?: boolean } = {}): Promise<void> => {
    await page.addInitScript(isDenied => {
        const read = (): Record<string, { id: string; secret: string }> => JSON.parse(localStorage.getItem('fake-biometric-store') ?? '{}')
        const write = (value: Record<string, unknown>): void => localStorage.setItem('fake-biometric-store', JSON.stringify(value))
        ;(globalThis as Record<string, unknown>).__TANTARA_BIOMETRIC__ = {
            isAvailable: async () => true,
            verify: async () => localStorage.getItem('fake-biometric-denied') !== '1' && !isDenied,
            saveSecret: async (key: string, id: string, secret: string) => write({ ...read(), [key]: { id, secret } }),
            readSecret: async (key: string) => read()[key] ?? null,
            deleteSecret: async (key: string) => {
                const next = read()
                delete next[key]
                write(next)
            },
        }
    }, options.isDenied ?? false)
}

const parentCard = (page: Page) => page.locator('button.card', { hasText: PARENT_NAME }).first()

const relock = async (page: Page): Promise<void> => {
    await page.evaluate(() => sessionStorage.clear())
    await page.goto('/profiles')
}

const members = async (api: APIRequestContext): Promise<IApiMember[]> => (await (await api.get('/api/members')).json()) as IApiMember[]

const enrolDevice = async (api: APIRequestContext): Promise<IDeviceBody> => {
    const response = await api.post('/api/devices', { data: { label: 'Test' } })
    expect(response.ok()).toBeTruthy()
    return (await response.json()) as IDeviceBody
}

const useDevice = (api: APIRequestContext, memberId: string, device: IDeviceBody, secret = device.secret) => {
    return api.post('/api/auth/profile', { data: { memberId, device: { id: device.id, secret } } })
}

test.describe('biometric unlock on a device without biometrics', () => {
    test('shows no biometric UI and keeps the code as the only option', async ({ page }) => {
        await signIn(page.request, uniqueAccount('bio-none'))
        await page.goto('/profiles')
        await parentCard(page).click()
        await unlockProfile(page)
        await expect(page).toHaveURL(/\/home/)
        await expect(page.getByRole('heading', { name: ENROL_HEADING })).toHaveCount(0)
        await relock(page)
        await parentCard(page).click()
        await expect(page.getByRole('heading', { name: 'Entre ton code' })).toBeVisible()
        await expect(page.getByRole('button', { name: UNLOCK_BUTTON })).toHaveCount(0)
    })
})

test.describe('biometric unlock with a native bridge', () => {
    test('offers to enrol after a code entry, then opens the profile without the code', async ({ page }) => {
        await installBridge(page)
        await signIn(page.request, uniqueAccount('bio-flow'))
        await page.goto('/profiles')
        await parentCard(page).click()
        await unlockProfile(page)
        await expect(page.getByRole('heading', { name: ENROL_HEADING })).toBeVisible()
        await page.getByRole('button', { name: 'Activer', exact: true }).click()
        await expect(page).toHaveURL(/\/home/)
        const devices = (await (await page.request.get('/api/devices')).json()) as { memberName: string }[]
        expect(devices).toHaveLength(1)
        expect(devices[0]?.memberName).toBe(PARENT_NAME)

        await relock(page)
        await parentCard(page).click()
        await expect(page.getByRole('heading', { name: 'Entre ton code' })).toBeVisible()
        await page.getByRole('button', { name: UNLOCK_BUTTON }).click()
        await expect(page).toHaveURL(/\/home/)
    })

    test('keeps the code when the user declines the offer', async ({ page }) => {
        await installBridge(page)
        await signIn(page.request, uniqueAccount('bio-skip'))
        await page.goto('/profiles')
        await parentCard(page).click()
        await unlockProfile(page)
        await page.getByRole('button', { name: 'Pas maintenant' }).click()
        await expect(page).toHaveURL(/\/home/)
        expect(await (await page.request.get('/api/devices')).json()).toEqual([])
    })

    test('stays on the code entry when the biometric check is cancelled', async ({ page }) => {
        await installBridge(page)
        await signIn(page.request, uniqueAccount('bio-cancel'))
        await page.goto('/profiles')
        await parentCard(page).click()
        await unlockProfile(page)
        await page.getByRole('button', { name: 'Activer', exact: true }).click()
        await expect(page).toHaveURL(/\/home/)
        await relock(page)
        await page.evaluate(() => localStorage.setItem('fake-biometric-denied', '1'))
        await parentCard(page).click()
        await page.getByRole('button', { name: UNLOCK_BUTTON }).click()
        await expect(page.getByRole('alert')).toContainText('Vérification annulée')
        await expect(page).toHaveURL(/\/profiles/)
        await page.evaluate(() => localStorage.removeItem('fake-biometric-denied'))
        await page.getByRole('button', { name: UNLOCK_BUTTON }).click()
        await expect(page).toHaveURL(/\/home/)
    })

    test('falls back to the code once a parent revoked the device', async ({ page }) => {
        await installBridge(page)
        await signIn(page.request, uniqueAccount('bio-revoked'))
        await page.goto('/profiles')
        await parentCard(page).click()
        await unlockProfile(page)
        await page.getByRole('button', { name: 'Activer', exact: true }).click()
        await expect(page).toHaveURL(/\/home/)
        await page.goto('/family/devices')
        await expect(page.getByText(PARENT_NAME, { exact: true })).toBeVisible()
        await page.getByRole('button', { name: /^Retirer/ }).click()
        await page.getByTestId('device-revoke-confirm').click()
        await expect(page.getByText('Aucun appareil enregistré.', { exact: true })).toBeVisible()

        await relock(page)
        await parentCard(page).click()
        await page.getByRole('button', { name: UNLOCK_BUTTON }).click()
        await expect(page.getByRole('alert')).toContainText('n’est plus valable')
        await expect(page.getByRole('button', { name: UNLOCK_BUTTON })).toHaveCount(0)
        await expect(page.getByRole('button', { name: 'Chiffre 1', exact: true })).toBeVisible()
    })
})

test.describe('device secret endpoint', () => {
    test('opens a profile with the device secret, refuses a wrong one and throttles guesses', async ({ playwright, baseURL }) => {
        const api = await playwright.request.newContext({ baseURL })
        await signIn(api, uniqueAccount('dev-throttle'))
        const parentId = await useProfile(api, PARENT_NAME)
        const device = await enrolDevice(api)
        expect(device.secret.length).toBeGreaterThanOrEqual(40)
        await api.post('/api/auth/profile', { data: { memberId: null } })
        expect((await useDevice(api, parentId, device)).ok()).toBeTruthy()
        expect(((await (await api.get('/api/auth/me')).json()) as { memberId: string }).memberId).toBe(parentId)
        await api.post('/api/auth/profile', { data: { memberId: null } })
        for (let tries = 0; tries < 5; tries++) {
            expect((await useDevice(api, parentId, device, 'wrong-secret')).status()).toBe(403)
        }
        expect((await useDevice(api, parentId, device, 'wrong-secret')).status()).toBe(429)
        expect((await useDevice(api, parentId, device)).status()).toBe(429)
        await api.dispose()
    })

    test('does not store the secret in clear text', async ({ playwright, baseURL }) => {
        const api = await playwright.request.newContext({ baseURL })
        await signIn(api, uniqueAccount('dev-hash'))
        await useProfile(api, PARENT_NAME)
        const device = await enrolDevice(api)
        const listing = JSON.stringify(await (await api.get('/api/devices')).json())
        expect(listing).not.toContain(device.secret)
        await api.dispose()
    })

    test('a device only opens the profile it was enrolled for, in its own family', async ({ playwright, baseURL }) => {
        const owner = await playwright.request.newContext({ baseURL })
        const other = await playwright.request.newContext({ baseURL })
        await signIn(owner, uniqueAccount('dev-owner'))
        await signIn(other, uniqueAccount('dev-other'))
        await useProfile(owner, PARENT_NAME)
        const device = await enrolDevice(owner)
        const relative = await owner.post('/api/members', {
            data: { name: 'Mamie', role: 'relative', color: 'coral', code: { kind: 'pin', value: '246801' } },
        })
        const relativeId = ((await relative.json()) as { id: string }).id
        expect((await useDevice(owner, relativeId, device)).status()).toBe(403)
        const foreignParent = (await members(other)).find(item => item.name === PARENT_NAME)!
        await useProfile(other, PARENT_NAME)
        expect((await useDevice(other, foreignParent.id, device)).status()).toBe(403)
        await owner.dispose()
        await other.dispose()
    })

    test('a parent revokes any device, a non-parent only their own', async ({ playwright, baseURL }) => {
        const api = await playwright.request.newContext({ baseURL })
        await signIn(api, uniqueAccount('dev-revoke'))
        const parentId = await useProfile(api, PARENT_NAME)
        const parentDevice = await enrolDevice(api)
        const created = await api.post('/api/members', {
            data: { name: 'Mamie', role: 'relative', color: 'coral', code: { kind: 'pin', value: '246801' } },
        })
        const relativeId = ((await created.json()) as { id: string }).id
        await api.post('/api/auth/profile', { data: { memberId: relativeId, code: '246801' } })
        const relativeDevice = await enrolDevice(api)
        const visible = (await (await api.get('/api/devices')).json()) as { id: string }[]
        expect(visible.map(item => item.id)).toEqual([relativeDevice.id])
        expect((await api.delete(`/api/devices/${parentDevice.id}`)).status()).toBe(404)

        await api.post('/api/auth/profile', { data: { memberId: parentId, code: PROFILE_PIN } })
        const all = (await (await api.get('/api/devices')).json()) as { id: string }[]
        expect(all.map(item => item.id).sort()).toEqual([parentDevice.id, relativeDevice.id].sort())
        expect((await api.delete(`/api/devices/${relativeDevice.id}`)).ok()).toBeTruthy()
        await api.post('/api/auth/profile', { data: { memberId: null } })
        expect((await useDevice(api, relativeId, relativeDevice)).status()).toBe(403)
        expect((await useDevice(api, parentId, parentDevice)).ok()).toBeTruthy()
        await api.dispose()
    })

    test('requires a chosen profile to enrol', async ({ playwright, baseURL }) => {
        const api = await playwright.request.newContext({ baseURL })
        await signIn(api, uniqueAccount('dev-noprofile'))
        expect((await api.post('/api/devices', { data: {} })).status()).toBe(403)
        await api.dispose()
    })
})
