import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { addMember, chooseProfile, PARENT_NAME, PROFILE_PIN, signIn, uniqueAccount, unlockProfile, useProfile } from './helpers'

interface IDeviceBody {
    id: string
    secret: string
}

const STORAGE_KEY = 'tantara-personal-device'

const enablePersonal = async (page: Page): Promise<void> => {
    await page.getByRole('button', { name: 'Réglages' }).click()
    await page.getByTestId('personal-device-toggle').click()
    await expect(page.getByTestId('personal-device-toggle')).toHaveAttribute('aria-checked', 'true')
    await page.getByTestId('settings-close').click()
}

const enrolPersonal = (api: APIRequestContext) => api.post('/api/devices', { data: { label: 'Test', isPersonal: true } })

test.describe('personal device mode', () => {
    test('opens straight on the parent profile without a code and asks the code to switch', async ({ page }) => {
        await signIn(page.request, uniqueAccount('personal-open'))
        await chooseProfile(page, PARENT_NAME)
        await enablePersonal(page)
        const stored = await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)
        expect(stored).not.toBeNull()

        await page.evaluate(() => sessionStorage.clear())
        await page.goto('/profiles')
        await expect(page).toHaveURL(/\/home/)

        await page.goto('/family')
        await expect(page).toHaveURL(/\/home/)
        await expect(page.getByTestId('personal-gate')).toBeVisible()
        await unlockProfile(page, PROFILE_PIN)
        await expect(page).toHaveURL(/\/family/)
    })

    test('turns off in one tap and brings the profile picker back', async ({ page }) => {
        await signIn(page.request, uniqueAccount('personal-off'))
        await chooseProfile(page, PARENT_NAME)
        await enablePersonal(page)
        await page.getByRole('button', { name: 'Réglages' }).click()
        await page.getByTestId('personal-device-toggle').click()
        await expect(page.getByTestId('personal-device-toggle')).toHaveAttribute('aria-checked', 'false')
        expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBeNull()
        const devices = (await (await page.request.get('/api/devices')).json()) as unknown[]
        expect(devices).toHaveLength(0)
    })

    test('falls back to the picker once the device is revoked from the account', async ({ page }) => {
        await signIn(page.request, uniqueAccount('personal-revoked'))
        await chooseProfile(page, PARENT_NAME)
        await enablePersonal(page)
        const devices = (await (await page.request.get('/api/devices')).json()) as { id: string; isPersonal: boolean }[]
        expect(devices.filter(device => device.isPersonal)).toHaveLength(1)
        expect((await page.request.delete(`/api/devices/${devices[0]!.id}`)).ok()).toBeTruthy()
        await page.evaluate(() => sessionStorage.clear())
        await page.goto('/profiles')
        await expect(page).toHaveURL(/\/profiles/)
        await expect(page.locator('button.card', { hasText: PARENT_NAME }).first()).toBeVisible()
        expect(await page.evaluate(key => localStorage.getItem(key), STORAGE_KEY)).toBeNull()
    })

    test('refuses personal mode for a child profile', async ({ page }) => {
        await signIn(page.request, uniqueAccount('personal-child'))
        await chooseProfile(page, PARENT_NAME)
        await addMember(page, 'Lova', 'Enfant')
        await useProfile(page.request, 'Lova')
        const response = await enrolPersonal(page.request)
        expect(response.status()).toBe(403)
    })

    test('stores the personal flag and lets a parent enrol through the API', async ({ page }) => {
        await signIn(page.request, uniqueAccount('personal-api'))
        await useProfile(page.request, PARENT_NAME)
        const response = await enrolPersonal(page.request)
        expect(response.ok()).toBeTruthy()
        const device = (await response.json()) as IDeviceBody
        expect(device.secret).not.toBe('')
    })
})
