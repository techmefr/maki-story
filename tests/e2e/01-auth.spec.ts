import { expect, test } from '@playwright/test'
import { E2E_PASSWORD, PARENT_NAME, signIn, uniqueAccount } from './helpers'

test.describe('authentication', () => {
    test('redirects anonymous visitors to the login page', async ({ page }) => {
        for (const path of ['/', '/home', '/kid', '/family', '/messages', '/books/new']) {
            await page.goto(path)
            await expect(page).toHaveURL(/\/login/)
        }
    })

    test('refuses a wrong password and an unknown e-mail', async ({ page, request }) => {
        const account = uniqueAccount('wrong')
        await signIn(request, account)
        await page.goto('/login')
        await page.getByLabel('E-mail').fill(account.email)
        await page.getByLabel('Mot de passe').fill('nope-nope')
        await page.getByRole('button', { name: 'Se connecter' }).click()
        await expect(page.getByText('E-mail ou mot de passe incorrect.')).toBeVisible()
        await page.getByLabel('E-mail').fill('someone@else.app')
        await page.getByLabel('Mot de passe').fill(E2E_PASSWORD)
        await page.getByRole('button', { name: 'Se connecter' }).click()
        await expect(page.getByText('E-mail ou mot de passe incorrect.')).toBeVisible()
        await expect(page).toHaveURL(/\/login/)
    })

    test('toggles password visibility', async ({ page }) => {
        await page.goto('/login')
        const field = page.getByLabel('Mot de passe')
        await expect(field).toHaveAttribute('type', 'password')
        await page.getByRole('button', { name: 'Voir' }).click()
        await expect(field).toHaveAttribute('type', 'text')
    })

    test('registers a family, keeps the session after a reload, signs out, then signs back in', async ({ page }) => {
        const account = uniqueAccount('register')
        await page.goto('/login')
        await page.getByRole('link', { name: 'Créer un compte famille' }).click()
        await expect(page.getByRole('heading', { name: 'Créer ma famille' })).toBeVisible()
        await page.getByLabel('E-mail').fill(account.email)
        await page.getByLabel('Mot de passe').fill(account.password)
        await page.getByLabel('Nom de la famille').fill(account.familyName)
        await page.getByLabel('Votre prénom').fill(PARENT_NAME)
        await page.getByRole('button', { name: 'Créer mon compte' }).click()
        await expect(page).toHaveURL(/\/profiles/)
        await expect(page.getByRole('heading', { name: 'Qui écoute ?' })).toBeVisible()
        await expect(page.locator('button.card', { hasText: PARENT_NAME })).toHaveCount(1)
        await page.reload()
        await expect(page).toHaveURL(/\/profiles/)
        await page.goto('/login')
        await expect(page).toHaveURL(/\/profiles/)
        await page.getByRole('button', { name: 'Se déconnecter' }).click()
        await expect(page).toHaveURL(/\/login/)
        await page.goto('/home')
        await expect(page).toHaveURL(/\/login/)
        await page.getByLabel('E-mail').fill(account.email.toUpperCase())
        await page.getByLabel('Mot de passe').fill(account.password)
        await page.getByRole('button', { name: 'Se connecter' }).click()
        await expect(page).toHaveURL(/\/profiles/)
        await expect(page.locator('button.card', { hasText: PARENT_NAME })).toHaveCount(1)
    })

    test('refuses a duplicate e-mail and weak input at registration', async ({ request }) => {
        const account = uniqueAccount('dup')
        await signIn(request, account)
        const duplicate = await request.post('/api/auth/register', {
            data: { email: account.email, password: account.password, familyName: 'Autre', parentName: 'Autre' },
        })
        expect(duplicate.status()).toBe(409)
        const weak = await request.post('/api/auth/register', {
            data: { email: uniqueAccount('weak').email, password: 'short', familyName: 'F', parentName: 'P' },
        })
        expect(weak.status()).toBe(400)
        const invalid = await request.post('/api/auth/register', {
            data: { email: 'not-an-email', password: E2E_PASSWORD, familyName: 'F', parentName: 'P' },
        })
        expect(invalid.status()).toBe(400)
    })

    test('slows brute force down per account', async ({ playwright, baseURL }) => {
        const account = uniqueAccount('throttle')
        const api = await playwright.request.newContext({ baseURL })
        await signIn(api, account)
        const attacker = await playwright.request.newContext({ baseURL })
        for (let attempt = 0; attempt < 5; attempt++) {
            const response = await attacker.post('/api/auth/login', { data: { email: account.email, password: 'wrong-password' } })
            expect(response.status()).toBe(401)
        }
        const blocked = await attacker.post('/api/auth/login', { data: { email: account.email, password: account.password } })
        expect(blocked.status()).toBe(429)
        await api.dispose()
        await attacker.dispose()
    })

    test('protects the api without a session', async ({ request }) => {
        for (const path of ['/api/members', '/api/books', '/api/messages', '/api/feedback']) {
            const response = await request.get(path)
            expect(response.status()).toBe(401)
        }
        const me = await request.get('/api/auth/me')
        expect(await me.json()).toEqual({ isSignedIn: false, memberId: null })
    })

    test('rejects a forged session cookie', async ({ playwright, baseURL }) => {
        const forged = await playwright.request.newContext({
            baseURL,
            extraHTTPHeaders: { cookie: 'tantara_session=eyJhIjoieCIsImYiOiJ5IiwibSI6bnVsbCwiZSI6OTk5OTk5OTk5OTk5OX0.invalid' },
        })
        expect((await forged.get('/api/members')).status()).toBe(401)
        await forged.dispose()
    })
})
