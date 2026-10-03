import { expect, test } from '@playwright/test'
import { E2E_PASSWORD, PARENT_NAME, signIn, uniqueAccount } from './helpers'

test.describe('authentication', () => {
    test('redirects anonymous visitors to the login page', async ({ page }) => {
        await page.addInitScript(() => localStorage.setItem('tantara-onboarded', '1'))
        for (const path of ['/', '/home', '/kid', '/family', '/messages', '/books/new']) {
            await page.goto(path)
            await expect(page).toHaveURL(/\/login/)
        }
    })

    test('refuses a wrong password and an unknown e-mail', async ({ page, request }) => {
        const account = uniqueAccount('wrong')
        await signIn(request, account)
        await page.goto('/login')
        await page.getByRole('tab', { name: 'Mot de passe' }).click()
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

    test('sends a magic link for a known account and says nothing about unknown ones', async ({ page, request }) => {
        const account = uniqueAccount('magic')
        await signIn(request, account)
        await page.goto('/login')
        await page.getByLabel('E-mail').fill(account.email)
        await page.getByRole('button', { name: 'Recevoir mon lien' }).click()
        await expect(page.getByRole('heading', { name: 'Regarde tes e-mails !' })).toBeVisible()
        await page.getByRole('button', { name: 'Changer d’adresse' }).click()
        await page.getByLabel('E-mail').fill('nobody@else.app')
        await page.getByRole('button', { name: 'Recevoir mon lien' }).click()
        await expect(page.getByRole('heading', { name: 'Regarde tes e-mails !' })).toBeVisible()
    })

    test('refuses an unknown magic link token', async ({ page }) => {
        await page.goto('/magic?token=unknown')
        await expect(page.getByText('Ce lien a expiré. Demande-en un nouveau.')).toBeVisible()
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
        await expect(page).toHaveURL(/\/welcome/)
        await expect(page.getByTestId('welcome-progress')).toBeVisible()
        await page.goto('/profiles')
        await expect(page).toHaveURL(/\/profiles/)
        await expect(page.getByRole('heading', { name: 'Qui est-ce ?' })).toBeVisible()
        await expect(page.locator('button.card', { hasText: PARENT_NAME })).toHaveCount(1)
        await page.reload()
        await expect(page).toHaveURL(/\/profiles/)
        await page.goto('/login')
        await expect(page).toHaveURL(/\/profiles/)
        await page.getByRole('button', { name: 'Déconnexion' }).click()
        await expect(page).toHaveURL(/\/login/)
        await page.goto('/home')
        await expect(page).toHaveURL(/\/login/)
        await page.getByRole('tab', { name: 'Mot de passe' }).click()
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

    test('keeps mobile keyboards from rewriting the credentials', async ({ page }) => {
        for (const path of ['/login', '/register']) {
            await page.goto(path)
            if (path === '/login') {
                await page.getByRole('tab', { name: 'Mot de passe' }).click()
            }
            const email = page.getByLabel('E-mail')
            await expect(email).toHaveAttribute('autocapitalize', 'off')
            await expect(email).toHaveAttribute('autocorrect', 'off')
            await expect(email).toHaveAttribute('spellcheck', 'false')
            await expect(email).toHaveAttribute('inputmode', 'email')
            const password = page.getByLabel('Mot de passe')
            await expect(password).toHaveAttribute('autocapitalize', 'off')
            await expect(password).toHaveAttribute('autocorrect', 'off')
            await expect(password).toHaveAttribute('spellcheck', 'false')
        }
        await page.goto('/login')
        await page.getByRole('tab', { name: 'Mot de passe' }).click()
        await expect(page.getByLabel('Mot de passe')).toHaveAttribute('autocomplete', 'current-password')
    })

    test('tells apart a wrong password, a throttle and an unreachable server', async ({ page }) => {
        await page.goto('/login')
        await page.getByRole('tab', { name: 'Mot de passe' }).click()
        await page.getByLabel('E-mail').fill('someone@else.app')
        await page.getByLabel('Mot de passe').fill('nope-nope')
        await page.getByRole('button', { name: 'Se connecter' }).click()
        await expect(page.getByText('E-mail ou mot de passe incorrect.')).toBeVisible()
        await page.route('**/api/auth/login', route =>
            route.fulfill({
                status: 429,
                contentType: 'application/json',
                headers: { 'retry-after': '420' },
                body: JSON.stringify({ statusCode: 429, statusMessage: 'Too many attempts, try again later', data: { retryAfterSeconds: 420 } }),
            }),
        )
        await page.getByRole('button', { name: 'Se connecter' }).click()
        await expect(page.getByText('Trop d’essais, réessaie dans 7 minutes.')).toBeVisible()
        await page.unroute('**/api/auth/login')
        await page.route('**/api/auth/login', route => route.abort('failed'))
        await page.getByRole('button', { name: 'Se connecter' }).click()
        await expect(page.getByText('Impossible de joindre le serveur. Vérifie ta connexion et réessaie.')).toBeVisible()
        await page.unroute('**/api/auth/login')
        await page.route('**/api/auth/login', route => route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }))
        await page.getByRole('button', { name: 'Se connecter' }).click()
        await expect(page.getByText('Le serveur a rencontré un problème. Réessaie dans un instant.')).toBeVisible()
    })

    test('reports the real retry delay when the server throttles', async ({ playwright, baseURL }) => {
        const account = uniqueAccount('retry')
        const api = await playwright.request.newContext({ baseURL })
        await signIn(api, account)
        const attacker = await playwright.request.newContext({ baseURL })
        for (let attempt = 0; attempt < 5; attempt++) {
            await attacker.post('/api/auth/login', { data: { email: account.email, password: 'wrong-password' } })
        }
        const blocked = await attacker.post('/api/auth/login', { data: { email: account.email, password: account.password } })
        expect(blocked.status()).toBe(429)
        const retryAfter = Number(blocked.headers()['retry-after'])
        expect(retryAfter).toBeGreaterThan(0)
        expect(retryAfter).toBeLessThanOrEqual(15 * 60)
        const body = await blocked.json()
        expect(body.data.retryAfterSeconds).toBe(retryAfter)
        await api.dispose()
        await attacker.dispose()
    })

    test('signs in with a padded, capitalised e-mail', async ({ page, request }) => {
        const account = uniqueAccount('padded')
        await signIn(request, account)
        await page.goto('/login')
        await page.getByRole('tab', { name: 'Mot de passe' }).click()
        await page.getByLabel('E-mail').fill(`  ${account.email.toUpperCase()}  `)
        await page.getByLabel('Mot de passe').fill(account.password)
        await page.getByRole('button', { name: 'Se connecter' }).click()
        await expect(page).toHaveURL(/\/profiles/)
    })

    test('treats composed and decomposed e-mails as the same account', async ({ playwright, baseURL }) => {
        const local = `e2e-${Date.now()}-café`
        const api = await playwright.request.newContext({ baseURL })
        const registered = await api.post('/api/auth/register', {
            data: { email: `${local}@tantara.test`, password: E2E_PASSWORD, familyName: 'Unicode', parentName: PARENT_NAME },
        })
        expect(registered.ok()).toBeTruthy()
        const other = await playwright.request.newContext({ baseURL })
        const decomposed = await other.post('/api/auth/login', {
            data: { email: ` ${local.normalize('NFD').toUpperCase()}@TANTARA.TEST `, password: E2E_PASSWORD },
        })
        expect(decomposed.ok()).toBeTruthy()
        await api.dispose()
        await other.dispose()
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
