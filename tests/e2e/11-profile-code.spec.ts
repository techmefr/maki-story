import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { addMember, openSwitcher, chooseProfile, enterPin, enterSymbols, login, PARENT_NAME, PROFILE_PIN, signIn, uniqueAccount, uniqueName, useProfile } from './helpers'
import type { IApiMember } from './helpers'

const listMembers = async (api: APIRequestContext): Promise<IApiMember[]> => {
    return (await (await api.get('/api/members')).json()) as IApiMember[]
}

const createMember = async (api: APIRequestContext, name: string, role: string, code?: object): Promise<string> => {
    const response = await api.post('/api/members', { data: { name, role, color: 'coral', code } })
    expect(response.ok()).toBeTruthy()
    return ((await response.json()) as { id: string }).id
}

const pinCode = (value: string): object => ({ kind: 'pin', value })

test.describe('profile codes', () => {
    test('refuses a wrong code on the picker and accepts the right one', async ({ page }, info) => {
        const name = uniqueName('Mamie', info.project.name)
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await addMember(page, name, 'Proche')
        await page.goto('/profiles')
        await page.locator('button.card', { hasText: name }).first().click()
        await enterPin(page, '999999')
        await expect(page).toHaveURL(/\/profiles/)
        await enterPin(page, PROFILE_PIN)
        await expect(page).toHaveURL(/\/home/)
    })

    test('forces a parent to create a code on first selection', async ({ page }) => {
        const account = uniqueAccount('first-code')
        await signIn(page.request, account)
        await page.goto('/profiles')
        await page.locator('button.card', { hasText: PARENT_NAME }).first().click()
        await expect(page.getByRole('heading', { name: 'Crée ton code' })).toBeVisible()
        await enterPin(page, '432109')
        await expect(page.getByRole('heading', { name: 'Confirme ton code' })).toBeVisible()
        await enterPin(page, '111222')
        await expect(page.getByRole('alert')).toHaveText('Les deux codes sont différents. Recommence.')
        await enterPin(page, '432109')
        await enterPin(page, '432109')
        await expect(page).toHaveURL(/\/home/)
        const members = await listMembers(page.request)
        expect(members.find(member => member.name === PARENT_NAME)?.hasCode).toBe(true)
    })

    test('locks a profile after repeated wrong codes, even for the right code', async ({ playwright, baseURL }) => {
        const api = await playwright.request.newContext({ baseURL })
        await signIn(api, uniqueAccount('lockout'))
        await useProfile(api, PARENT_NAME)
        const relativeId = await createMember(api, 'Mamie', 'relative', pinCode('246801'))
        const attempt = async (code: string): Promise<number> => {
            const response = await api.post('/api/auth/profile', { data: { memberId: relativeId, code } })
            return response.status()
        }
        for (let tries = 0; tries < 4; tries++) {
            expect(await attempt('0000')).toBe(403)
        }
        expect(await attempt('0000')).toBe(429)
        expect(await attempt('246801')).toBe(429)
        const state = (await (await api.get('/api/auth/me')).json()) as IAuthStateBody
        expect(state.memberId).not.toBe(relativeId)
        await api.dispose()
    })

    test('keeps the active profile when a code is wrong', async ({ playwright, baseURL }) => {
        const api = await playwright.request.newContext({ baseURL })
        await signIn(api, uniqueAccount('keep'))
        const parentId = await useProfile(api, PARENT_NAME)
        const relativeId = await createMember(api, 'Mamie', 'relative', pinCode('246801'))
        const wrong = await api.post('/api/auth/profile', { data: { memberId: relativeId, code: '135790' } })
        expect(wrong.status()).toBe(403)
        const missing = await api.post('/api/auth/profile', { data: { memberId: relativeId } })
        expect(missing.status()).toBe(403)
        const state = (await (await api.get('/api/auth/me')).json()) as IAuthStateBody
        expect(state.memberId).toBe(parentId)
        await api.dispose()
    })

    test('a child session cannot reach or change a parent profile', async ({ playwright, baseURL }) => {
        const api = await playwright.request.newContext({ baseURL })
        await signIn(api, uniqueAccount('child-jail'))
        const parentId = await useProfile(api, PARENT_NAME)
        const childId = await createMember(api, 'Lova', 'child', pinCode('135790'))
        const otherParentId = await createMember(api, 'Papa', 'parent')
        const relativeId = await createMember(api, 'Mamie', 'relative', pinCode('246801'))
        const entered = await api.post('/api/auth/profile', { data: { memberId: childId, code: '135790' } })
        expect(entered.ok()).toBeTruthy()

        const noCode = await api.post('/api/auth/profile', { data: { memberId: parentId } })
        expect(noCode.status()).toBe(403)
        const guessed = await api.post('/api/auth/profile', { data: { memberId: parentId, code: '0000' } })
        expect(guessed.status()).toBe(403)
        const claimed = await api.post('/api/auth/profile', {
            data: { memberId: otherParentId, newCode: pinCode('777888') },
        })
        expect(claimed.status()).toBe(403)
        const reset = await api.put(`/api/members/${parentId}/code`, { data: pinCode('777888') })
        expect(reset.status()).toBe(403)
        const resetRelative = await api.put(`/api/members/${relativeId}/code`, { data: pinCode('777888') })
        expect(resetRelative.status()).toBe(403)
        const ownReset = await api.put(`/api/members/${childId}/code`, { data: { ...pinCode('777888'), currentCode: '135790' } })
        expect(ownReset.status()).toBe(403)
        const addWithCode = await api.post('/api/members', { data: { name: 'Intrus', role: 'parent', color: 'sky', code: pinCode('121233') } })
        expect(addWithCode.status()).toBe(403)

        const state = (await (await api.get('/api/auth/me')).json()) as IAuthStateBody
        expect(state.memberId).toBe(childId)
        const back = await api.post('/api/auth/profile', { data: { memberId: parentId, code: PROFILE_PIN } })
        expect(back.ok()).toBeTruthy()
        await api.dispose()
    })

    test('a parent can set a child code and a relative needs the current code to change their own', async ({ playwright, baseURL }) => {
        const api = await playwright.request.newContext({ baseURL })
        await signIn(api, uniqueAccount('code-change'))
        await useProfile(api, PARENT_NAME)
        const childId = await createMember(api, 'Lova', 'child')
        const relativeId = await createMember(api, 'Mamie', 'relative', pinCode('246801'))
        const refused = await api.post('/api/auth/profile', { data: { memberId: childId, newCode: pinCode('111222') } })
        expect(refused.status()).toBe(403)
        const set = await api.put(`/api/members/${childId}/code`, { data: { kind: 'symbols', value: '0213' } })
        expect(set.ok()).toBeTruthy()
        const invalid = await api.put(`/api/members/${childId}/code`, { data: { kind: 'symbols', value: '021' } })
        expect(invalid.status()).toBe(400)
        const tooShort = await api.put(`/api/members/${relativeId}/code`, { data: pinCode('12') })
        expect(tooShort.status()).toBe(400)
        const enterRelative = await api.post('/api/auth/profile', { data: { memberId: relativeId, code: '246801' } })
        expect(enterRelative.ok()).toBeTruthy()
        const withoutCurrent = await api.put(`/api/members/${relativeId}/code`, { data: pinCode('975310') })
        expect(withoutCurrent.status()).toBe(403)
        const changed = await api.put(`/api/members/${relativeId}/code`, { data: { ...pinCode('975310'), currentCode: '246801' } })
        expect(changed.ok()).toBeTruthy()
        const again = await api.post('/api/auth/profile', { data: { memberId: relativeId, code: '975310' } })
        expect(again.ok()).toBeTruthy()
        await api.dispose()
    })

    test('a child switching in the app cannot open the parent without its code', async ({ page }, info) => {
        const child = uniqueName('Lova', info.project.name)
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await addMember(page, child, 'Enfant')
        await chooseProfile(page, child)
        await expect(page).toHaveURL(/\/kid/)
        await openSwitcher(page)
        await page.locator('.sheet button.card', { hasText: PARENT_NAME }).first().click()
        await enterPin(page, '0000')
        await expect(page.getByRole('alert')).toHaveText('Code incorrect. Essaie encore.')
        await expect(page).toHaveURL(/\/kid/)
        const state = (await (await page.request.get('/api/auth/me')).json()) as IAuthStateBody
        expect(state.memberId).not.toBeNull()
        await page.goto('/home')
        await expect(page).toHaveURL(/\/kid/)
    })

    test('returns to the picker after a resume from the background', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await expect(page).toHaveURL(/\/home/)
        await page.evaluate(() => {
            Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
            document.dispatchEvent(new Event('visibilitychange'))
        })
        await page.waitForTimeout(200)
        await page.evaluate(() => {
            window.sessionStorage.setItem('tantara-hidden-at', String(Date.now() - 120_000))
            Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
            document.dispatchEvent(new Event('visibilitychange'))
        })
        await expect(page).toHaveURL(/\/profiles/)
        await expect(page.getByRole('heading', { name: 'Qui est-ce ?' })).toBeVisible()
        const state = (await (await page.request.get('/api/auth/me')).json()) as IAuthStateBody
        expect(state.memberId).toBeNull()
    })

    test('keeps the profile after a short background pause', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.evaluate(() => {
            Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
            document.dispatchEvent(new Event('visibilitychange'))
            Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' })
            document.dispatchEvent(new Event('visibilitychange'))
        })
        await page.waitForTimeout(500)
        await expect(page).toHaveURL(/\/home/)
    })

    test('a cold start goes back to the picker and a reload keeps the profile', async ({ page, browser }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.reload()
        await expect(page).toHaveURL(/\/home/)
        const storageState = await page.context().storageState()
        const cold = await browser.newContext({ storageState, baseURL: page.url().split('/home')[0] })
        const coldPage = await cold.newPage()
        await coldPage.goto('/home')
        await expect(coldPage).toHaveURL(/\/profiles/)
        const state = (await (await coldPage.request.get('/api/auth/me')).json()) as IAuthStateBody
        expect(state.memberId).toBeNull()
        await cold.close()
    })

    test('a child uses a shape code, and a wrong order is refused', async ({ page }, info) => {
        const child = uniqueName('Shapy', info.project.name)
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.goto('/family/add')
        await page.getByPlaceholder('Maman, Mamie, Lova…').fill(child)
        await page.getByRole('button', { name: 'Enfant', exact: true }).click()
        await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
        await enterSymbols(page, ['Étoile rouge', 'Soleil jaune', 'Lune bleue', 'Cœur vert'])
        await page.getByRole('button', { name: 'Enregistrer' }).click()
        await expect(page).toHaveURL(/\/family$/)
        const members = await listMembers(page.request)
        expect(members.find(member => member.name === child)).toMatchObject({ hasCode: true, codeKind: 'symbols' })

        await page.goto('/profiles')
        await page.locator('button.card', { hasText: child }).first().click()
        await expect(page.getByRole('heading', { name: 'Entre ton code' })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Chiffre 1' })).toHaveCount(0)
        await enterSymbols(page, ['Étoile rouge', 'Lune bleue', 'Soleil jaune', 'Cœur vert'])
        await expect(page).toHaveURL(/\/profiles/)
        await enterSymbols(page, ['Étoile rouge', 'Soleil jaune', 'Lune bleue', 'Cœur vert'])
        await expect(page).toHaveURL(/\/kid/)
    })

    test('a child without a code waits for a parent', async ({ page }, info) => {
        const child = uniqueName('SansCode', info.project.name)
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await createMember(page.request, child, 'child')
        await page.goto('/profiles')
        await page.locator('button.card', { hasText: child }).first().click()
        await expect(page.getByText('Un parent doit d’abord choisir le code')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Chiffre 1' })).toHaveCount(0)
    })
})

interface IAuthStateBody {
    isSignedIn: boolean
    memberId: string | null
}
