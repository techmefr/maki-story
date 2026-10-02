import { expect, test } from '@playwright/test'
import type { APIRequestContext, Playwright } from '@playwright/test'
import { chooseProfile, createReadyBook, enterPin, PARENT_NAME, PROFILE_PIN, signIn, uniqueAccount, useProfile } from './helpers'
import type { IE2eAccount } from './helpers'

const DAYS = 7
const FULL_DAY = { isOpen: true, from: '00:00', to: '23:59' }
const NARROW = { isOpen: true, from: '00:00', to: '00:01' }

const weekly = (window: object): object[] => Array.from({ length: DAYS }, () => ({ ...window }))

const openSession = async (playwright: Playwright, baseURL: string | undefined, account: IE2eAccount): Promise<APIRequestContext> => {
    const api = await playwright.request.newContext({ baseURL })
    await signIn(api, account)
    return api
}

const createChild = async (api: APIRequestContext, name = 'Lova'): Promise<string> => {
    const response = await api.post('/api/members', { data: { name, role: 'child', color: 'sky', code: { kind: 'pin', value: PROFILE_PIN } } })
    expect(response.ok()).toBeTruthy()
    return ((await response.json()) as { id: string }).id
}

const putSchedule = (api: APIRequestContext, childId: string, isEnabled: boolean, days: object[]) =>
    api.put(`/api/members/${childId}/schedule`, { data: { isEnabled, weekly: days, timezone: 'UTC' } })

const access = async (api: APIRequestContext): Promise<{ isAllowed: boolean; reason: string | null; resumeAt: string | null }> =>
    (await (await api.get('/api/access')).json()) as { isAllowed: boolean; reason: string | null; resumeAt: string | null }

test.describe('parental schedule on the server', () => {
    test('refuses child actions outside the window and allows them inside', async ({ playwright, baseURL }) => {
        const account = uniqueAccount('parental-server')
        const parent = await openSession(playwright, baseURL, account)
        await useProfile(parent, PARENT_NAME)
        const childId = await createChild(parent)
        const child = await openSession(playwright, baseURL, account)
        expect((await child.post('/api/auth/profile', { data: { memberId: childId, code: PROFILE_PIN } })).ok()).toBeTruthy()

        expect((await child.get('/api/books')).ok()).toBeTruthy()
        expect((await putSchedule(parent, childId, true, weekly(NARROW))).ok()).toBeTruthy()
        const refused = await child.get('/api/books')
        expect(refused.status()).toBe(403)
        expect(((await refused.json()) as { data: { code: string } }).data.code).toBe('outside-hours')
        expect((await child.post('/api/messages', { data: {} })).status()).toBe(403)
        expect((await child.get('/api/members')).ok()).toBeTruthy()
        const closed = await access(child)
        expect(closed.isAllowed).toBe(false)
        expect(closed.reason).toBe('schedule')
        expect(closed.resumeAt).not.toBeNull()
        expect(Date.parse(closed.resumeAt!)).toBeGreaterThan(Date.now())
        expect((await parent.get('/api/books')).ok()).toBeTruthy()

        expect((await putSchedule(parent, childId, true, weekly(FULL_DAY))).ok()).toBeTruthy()
        expect((await child.get('/api/books')).ok()).toBeTruthy()

        const dayOff = weekly(FULL_DAY) as { isOpen: boolean }[]
        dayOff[new Date().getUTCDay()]!.isOpen = false
        expect((await putSchedule(parent, childId, true, dayOff)).ok()).toBeTruthy()
        expect((await child.get('/api/books')).status()).toBe(403)

        expect((await putSchedule(parent, childId, false, dayOff)).ok()).toBeTruthy()
        expect((await child.get('/api/books')).ok()).toBeTruthy()
        await parent.dispose()
        await child.dispose()
    })

    test('the manual switch cuts now or until a time and can be cleared', async ({ playwright, baseURL }) => {
        const account = uniqueAccount('parental-manual')
        const parent = await openSession(playwright, baseURL, account)
        await useProfile(parent, PARENT_NAME)
        const childId = await createChild(parent)
        const child = await openSession(playwright, baseURL, account)
        expect((await child.post('/api/auth/profile', { data: { memberId: childId, code: PROFILE_PIN } })).ok()).toBeTruthy()

        expect((await parent.put(`/api/members/${childId}/access-block`, { data: { mode: 'now' } })).ok()).toBeTruthy()
        expect((await child.get('/api/books')).status()).toBe(403)
        expect(await access(child)).toMatchObject({ isAllowed: false, reason: 'manual', resumeAt: null })

        const until = new Date(Date.now() + 3_600_000).toISOString()
        expect((await parent.put(`/api/members/${childId}/access-block`, { data: { mode: 'until', until } })).ok()).toBeTruthy()
        const timed = await access(child)
        expect(timed.isAllowed).toBe(false)
        expect(new Date(timed.resumeAt!).getTime()).toBe(Date.parse(until))

        expect((await parent.put(`/api/members/${childId}/access-block`, { data: { mode: 'until', until: new Date(Date.now() - 1000).toISOString() } })).status()).toBe(400)
        expect((await parent.put(`/api/members/${childId}/access-block`, { data: { mode: 'clear' } })).ok()).toBeTruthy()
        expect((await child.get('/api/books')).ok()).toBeTruthy()
        await parent.dispose()
        await child.dispose()
    })

    test('only a parent manages schedules, only for a child, and invalid input is refused', async ({ playwright, baseURL }) => {
        const account = uniqueAccount('parental-rules')
        const parent = await openSession(playwright, baseURL, account)
        const parentId = await useProfile(parent, PARENT_NAME)
        const childId = await createChild(parent)
        const relativeResponse = await parent.post('/api/members', { data: { name: 'Mamie', role: 'relative', color: 'coral', code: { kind: 'pin', value: '2468' } } })
        const relativeId = ((await relativeResponse.json()) as { id: string }).id

        expect((await putSchedule(parent, parentId, true, weekly(FULL_DAY))).status()).toBe(400)
        expect((await putSchedule(parent, relativeId, true, weekly(FULL_DAY))).status()).toBe(400)
        expect((await putSchedule(parent, childId, true, weekly({ isOpen: true, from: '20:00', to: '08:00' }))).status()).toBe(400)
        expect((await putSchedule(parent, childId, true, weekly(FULL_DAY).slice(0, 3))).status()).toBe(400)
        expect((await parent.put(`/api/members/${childId}/schedule`, { data: { isEnabled: true, weekly: weekly(FULL_DAY), timezone: 'Mars/Olympus' } })).status()).toBe(400)

        const child = await openSession(playwright, baseURL, account)
        expect((await child.post('/api/auth/profile', { data: { memberId: childId, code: PROFILE_PIN } })).ok()).toBeTruthy()
        expect((await putSchedule(child, childId, false, weekly(FULL_DAY))).status()).toBe(403)
        expect((await child.put(`/api/members/${childId}/access-block`, { data: { mode: 'clear' } })).status()).toBe(403)
        expect((await child.get(`/api/members/${childId}/schedule`)).status()).toBe(403)

        const relative = await openSession(playwright, baseURL, account)
        expect((await relative.post('/api/auth/profile', { data: { memberId: relativeId, code: '2468' } })).ok()).toBeTruthy()
        expect((await putSchedule(relative, childId, false, weekly(FULL_DAY))).status()).toBe(403)
        await parent.dispose()
        await child.dispose()
        await relative.dispose()
    })
})

test.describe('parental schedule in the app', () => {
    test('a parent configures the schedule and the manual switch from the family screen', async ({ page }) => {
        await signIn(page.request, uniqueAccount('parental-form'))
        await chooseProfile(page, PARENT_NAME)
        const childId = await createChild(page.request)
        await page.goto(`/family/${childId}`)
        await expect(page.getByTestId('parental-status')).toHaveText('Écoute libre.')

        await page.getByTestId('schedule-enabled').check()
        await page.getByTestId('day-from-1').fill('09:00')
        await page.getByTestId('day-to-1').fill('17:30')
        await page.getByTestId('day-open-0').uncheck()
        await page.getByTestId('schedule-save').click()
        await expect(page.getByTestId('parental-status')).toHaveText('Écoute limitée aux horaires.')
        await page.reload()
        await expect(page.getByTestId('day-from-1')).toHaveValue('09:00')
        await expect(page.getByTestId('day-to-1')).toHaveValue('17:30')
        await expect(page.getByTestId('day-open-0')).not.toBeChecked()

        await page.getByTestId('block-now').click()
        await expect(page.getByTestId('parental-status')).toHaveText('Écoute coupée jusqu’à ce que tu la rétablisses.')
        await page.getByTestId('block-clear').click()
        await expect(page.getByTestId('parental-status')).toHaveText('Écoute limitée aux horaires.')
        await page.getByTestId('block-until-time').fill('23:59')
        await page.getByTestId('block-until').click()
        await expect(page.getByTestId('parental-status')).toContainText('Écoute coupée jusqu’à')
    })

    test('the child gets a text-free locked screen, a parent can step in, and it reopens by itself', async ({ page, playwright, baseURL }) => {
        const account = uniqueAccount('parental-locked')
        await signIn(page.request, account)
        const parent = await openSession(playwright, baseURL, account)
        await useProfile(parent, PARENT_NAME)
        const childId = await createChild(parent)
        expect((await parent.put(`/api/members/${childId}/access-block`, { data: { mode: 'now' } })).ok()).toBeTruthy()

        await chooseProfile(page, 'Lova')
        await expect(page).toHaveURL(/\/kid\/locked/)
        const screen = page.getByTestId('locked-screen')
        await expect(screen).toBeVisible()
        await expect(screen).toHaveText('')
        await expect(screen.getByRole('img', { name: 'Retour de l’heure d’écoute' })).toBeVisible()
        await page.goto('/kid')
        await expect(page).toHaveURL(/\/kid\/locked/)
        expect((await parent.put(`/api/members/${childId}/access-block`, { data: { mode: 'clear' } })).ok()).toBeTruthy()
        await expect(page).toHaveURL(/\/kid$/, { timeout: 15_000 })
        await expect(page.getByRole('heading', { name: /Coucou/ })).toBeVisible()

        expect((await parent.put(`/api/members/${childId}/access-block`, { data: { mode: 'now' } })).ok()).toBeTruthy()
        await expect(page).toHaveURL(/\/kid\/locked/, { timeout: 15_000 })
        await page.getByTestId('locked-parent').click()
        await expect(page.getByRole('heading', { name: 'Code d’un parent' })).toBeVisible()
        await enterPin(page, PROFILE_PIN)
        await expect(page).toHaveURL(/\/kid$/)
        await expect(page.getByRole('heading', { name: /Coucou/ })).toBeVisible()
        await parent.dispose()
    })

    test('playback stops and the locked screen shows when a parent cuts access while a child listens', async ({ page, playwright, baseURL }) => {
        const account = uniqueAccount('parental-playback')
        await signIn(page.request, account)
        await page.goto('/profiles')
        const bookId = await createReadyBook(page, 'Histoire coupée', 'solo', [
            { pageIndex: 0, character: '', text: 'Un', memberName: PARENT_NAME },
            { pageIndex: 0, character: '', text: 'Deux', memberName: PARENT_NAME },
        ])
        const parent = await openSession(playwright, baseURL, account)
        await useProfile(parent, PARENT_NAME)
        const childId = await createChild(parent)

        await chooseProfile(page, 'Lova')
        await page.goto(`/kid/listen/${bookId}`)
        await page.getByRole('button', { name: 'Lire' }).click()
        await expect(page.getByText(/lit$/)).toBeVisible()
        expect((await parent.put(`/api/members/${childId}/access-block`, { data: { mode: 'now' } })).ok()).toBeTruthy()
        await expect(page).toHaveURL(/\/kid\/locked/, { timeout: 15_000 })
        await expect(page.getByTestId('locked-screen')).toHaveText('')
        await parent.dispose()
    })

    test('the locked screen fits the large text size without overflow', async ({ page, playwright, baseURL }) => {
        const account = uniqueAccount('parental-large')
        await signIn(page.request, account)
        const parent = await openSession(playwright, baseURL, account)
        await useProfile(parent, PARENT_NAME)
        const childId = await createChild(parent)
        expect((await parent.put(`/api/members/${childId}/access-block`, { data: { mode: 'now' } })).ok()).toBeTruthy()
        await chooseProfile(page, 'Lova')
        await expect(page.getByTestId('locked-screen')).toBeVisible()
        await page.evaluate(() => {
            document.documentElement.style.fontSize = '40px'
        })
        const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)
        expect(hasOverflow).toBe(false)
        const button = await page.getByTestId('locked-parent').boundingBox()
        const viewport = page.viewportSize()!
        expect(button!.x + button!.width).toBeLessThanOrEqual(viewport.width)
        expect(button!.y + button!.height).toBeLessThanOrEqual(viewport.height)
        await parent.dispose()
    })
})
