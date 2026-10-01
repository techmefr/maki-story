import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import { configuredProviders, upcomingProviders } from '../../shared/utils/oauth'
import { E2E_PASSWORD, PARENT_NAME, signIn, uniqueAccount } from './helpers'
import type { IApiMember } from './helpers'

const IOS_AGENT =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'

interface IFakeOptions {
    sub?: string
    email?: string
    isVerified?: boolean
    givenName?: string
    state?: string
    user?: string
}

const uniqueEmail = (label: string): string => `social-${label}-${randomUUID().slice(0, 8)}@tantara.test`

const startUrl = (provider: string, options: IFakeOptions): string => {
    const fake = {
        sub: options.sub ?? `sub-${randomUUID()}`,
        email: options.email ?? uniqueEmail(provider),
        email_verified: options.isVerified ?? true,
        given_name: options.givenName,
        state: options.state,
        user: options.user,
    }
    return `/api/auth/oauth/${provider}/start?fake=${encodeURIComponent(JSON.stringify(fake))}`
}

const members = async (api: APIRequestContext): Promise<IApiMember[]> => (await (await api.get('/api/members')).json()) as IApiMember[]

const isSignedIn = async (page: Page): Promise<boolean> => {
    return ((await (await page.request.get('/api/auth/me')).json()) as { isSignedIn: boolean }).isSignedIn
}

test.skip(Boolean(process.env.E2E_BASE_URL), 'needs the fake OIDC provider of the local test server')

test.describe('provider configuration', () => {
    test('lists only configured providers and keeps the others as upcoming', () => {
        expect(configuredProviders({})).toEqual([])
        expect(configuredProviders({ GOOGLE_CLIENT_ID: 'id' })).toEqual([])
        expect(configuredProviders({ GOOGLE_CLIENT_ID: 'id', GOOGLE_CLIENT_SECRET: 'secret' })).toEqual(['google'])
        expect(
            configuredProviders({ APPLE_CLIENT_ID: 'id', APPLE_TEAM_ID: 't', APPLE_KEY_ID: 'k', APPLE_PRIVATE_KEY: 'p' }),
        ).toEqual(['apple'])
        expect(configuredProviders({ OIDC_FAKE: '1', GOOGLE_CLIENT_ID: 'id' })).toEqual(['google'])
        expect(upcomingProviders({})).toEqual(['google', 'apple', 'microsoft', 'facebook'])
        expect(upcomingProviders({ OIDC_FAKE: '1', GOOGLE_CLIENT_ID: 'id', APPLE_CLIENT_ID: 'id' })).toEqual(['microsoft', 'facebook'])
    })

    test('refuses to start a provider that is not configured', async ({ request }) => {
        expect((await request.get('/api/auth/oauth/microsoft/start', { maxRedirects: 0 })).status()).toBe(404)
    })
})

test.describe('login page', () => {
    test('shows Google, hides Apple outside Apple platforms, and lists upcoming providers as disabled', async ({ page }) => {
        await page.goto('/login')
        await expect(page.getByRole('link', { name: 'Continuer avec Google' })).toBeVisible()
        await expect(page.getByRole('link', { name: 'Continuer avec Apple' })).toHaveCount(0)
        const other = page.getByRole('button', { name: 'Autre compte' })
        await expect(other).toHaveAttribute('aria-expanded', 'false')
        await other.click()
        await expect(other).toHaveAttribute('aria-expanded', 'true')
        for (const name of ['Microsoft', 'Facebook']) {
            const entry = page.getByRole('button', { name: new RegExp(`${name}.*bientôt disponible`) })
            await expect(entry).toBeVisible()
            await expect(entry).toBeDisabled()
        }
    })

    test('shows Apple on an iOS browser', async ({ browser, baseURL }) => {
        const context = await browser.newContext({ baseURL, userAgent: IOS_AGENT })
        const page = await context.newPage()
        await page.goto('/login')
        await expect(page.getByRole('link', { name: 'Continuer avec Apple' })).toBeVisible()
        await context.close()
    })

    test('points the Google button at the server flow', async ({ page }) => {
        await page.goto('/login')
        await expect(page.getByRole('link', { name: 'Continuer avec Google' })).toHaveAttribute('href', '/api/auth/oauth/google/start')
    })
})

test.describe('social sign-in', () => {
    test('creates an account, a family and a parent profile for a new verified e-mail', async ({ page }) => {
        await page.goto(startUrl('google', { givenName: 'Soa' }))
        await expect(page).toHaveURL(/\/profiles/)
        expect(await isSignedIn(page)).toBe(true)
        const list = await members(page.request)
        expect(list).toHaveLength(1)
        expect(list[0]).toMatchObject({ name: 'Soa', role: 'parent' })
    })

    test('recognises the same identity on the next sign-in without duplicating the account', async ({ browser, baseURL }) => {
        const sub = `sub-${randomUUID()}`
        const email = uniqueEmail('again')
        const first = await browser.newContext({ baseURL })
        const firstPage = await first.newPage()
        await firstPage.goto(startUrl('google', { sub, email, givenName: 'Tiana' }))
        await expect(firstPage).toHaveURL(/\/profiles/)
        const firstMembers = await members(firstPage.request)
        const second = await browser.newContext({ baseURL })
        const secondPage = await second.newPage()
        await secondPage.goto(startUrl('google', { sub, email: uniqueEmail('changed'), givenName: 'Autre' }))
        await expect(secondPage).toHaveURL(/\/profiles/)
        expect((await members(secondPage.request)).map(item => item.id)).toEqual(firstMembers.map(item => item.id))
        await first.close()
        await second.close()
    })

    test('links a verified e-mail to the existing password account instead of creating another one', async ({ browser, baseURL, playwright }) => {
        const account = uniqueAccount('link')
        const api = await playwright.request.newContext({ baseURL })
        await signIn(api, account)
        const existing = await members(api)
        const context = await browser.newContext({ baseURL })
        const page = await context.newPage()
        await page.goto(startUrl('google', { email: account.email, givenName: 'Nouveau' }))
        await expect(page).toHaveURL(/\/profiles/)
        expect((await members(page.request)).map(item => item.id)).toEqual(existing.map(item => item.id))
        const login = await api.post('/api/auth/login', { data: { email: account.email, password: E2E_PASSWORD } })
        expect(login.ok()).toBeTruthy()
        await context.close()
        await api.dispose()
    })

    test('never links nor creates an account for an unverified e-mail', async ({ page, request, playwright, baseURL }) => {
        const account = uniqueAccount('unverified')
        const owner = await playwright.request.newContext({ baseURL })
        await signIn(owner, account)
        await page.goto(startUrl('google', { email: account.email, isVerified: false }))
        await expect(page).toHaveURL(/\/login\?error=email_unverified/)
        await expect(page.getByRole('alert')).toContainText('e-mail vérifié')
        expect(await isSignedIn(page)).toBe(false)

        const stranger = uniqueEmail('stranger')
        await page.goto(startUrl('google', { email: stranger, isVerified: false }))
        await expect(page).toHaveURL(/\/login\?error=email_unverified/)
        const attempt = await request.post('/api/auth/login', { data: { email: stranger, password: E2E_PASSWORD } })
        expect(attempt.status()).toBe(401)
        await owner.dispose()
    })

    test('refuses a callback whose state does not match', async ({ page }) => {
        await page.goto(startUrl('google', { state: 'forged-state' }))
        await expect(page).toHaveURL(/\/login\?error=oauth_state/)
        await expect(page.getByRole('alert')).toContainText('La connexion a expiré')
        expect(await isSignedIn(page)).toBe(false)
    })

    test('refuses a callback without the flow cookie', async ({ request }) => {
        const response = await request.get('/api/auth/oauth/google/callback?code=abc&state=abc', { maxRedirects: 0 })
        expect(response.status()).toBe(303)
        expect(response.headers().location).toBe('/login?error=oauth_state')
    })

    test('signs in with Apple through a form post and reads the name sent on first sign-in', async ({ page }) => {
        const user = JSON.stringify({ name: { firstName: 'Hery', lastName: 'Rakoto' } })
        await page.goto(startUrl('apple', { user }))
        await expect(page).toHaveURL(/\/profiles/)
        expect((await members(page.request))[0]).toMatchObject({ name: 'Hery', role: 'parent' })
    })

    test('keeps two social accounts isolated', async ({ browser, baseURL }) => {
        const one = await browser.newContext({ baseURL })
        const two = await browser.newContext({ baseURL })
        const pageOne = await one.newPage()
        const pageTwo = await two.newPage()
        await pageOne.goto(startUrl('google', { givenName: 'Un' }))
        await pageTwo.goto(startUrl('google', { givenName: 'Deux' }))
        await expect(pageOne).toHaveURL(/\/profiles/)
        await expect(pageTwo).toHaveURL(/\/profiles/)
        const idsOne = (await members(pageOne.request)).map(item => item.id)
        const idsTwo = (await members(pageTwo.request)).map(item => item.id)
        expect(idsOne.filter(id => idsTwo.includes(id))).toEqual([])
        expect((await members(pageOne.request))[0]?.name).not.toBe(PARENT_NAME)
        await one.close()
        await two.close()
    })
})
