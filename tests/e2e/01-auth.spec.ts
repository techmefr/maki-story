import { expect, test } from '@playwright/test'
import { E2E_EMAIL, E2E_PASSWORD, login } from './helpers'

test.describe('authentication', () => {
    test('redirects anonymous visitors to the login page', async ({ page }) => {
        for (const path of ['/', '/home', '/kid', '/family', '/messages', '/books/new']) {
            await page.goto(path)
            await expect(page).toHaveURL(/\/login/)
        }
    })

    test('refuses a wrong password and an unknown e-mail', async ({ page }) => {
        await page.goto('/login')
        await page.getByLabel('E-mail').fill(E2E_EMAIL)
        await page.getByLabel('Mot de passe').fill('nope')
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

    test('signs in, keeps the session after a reload, then signs out', async ({ page }) => {
        await login(page)
        await expect(page.getByRole('heading', { name: 'Qui écoute ?' })).toBeVisible()
        await page.reload()
        await expect(page).toHaveURL(/\/profiles/)
        await page.goto('/login')
        await expect(page).toHaveURL(/\/profiles/)
        await page.getByRole('button', { name: 'Se déconnecter' }).click()
        await expect(page).toHaveURL(/\/login/)
        await page.goto('/home')
        await expect(page).toHaveURL(/\/login/)
    })

    test('protects the api without a session', async ({ request }) => {
        for (const path of ['/api/members', '/api/books', '/api/messages', '/api/feedback']) {
            const response = await request.get(path)
            expect(response.status()).toBe(401)
        }
        const me = await request.get('/api/auth/me')
        expect(await me.json()).toEqual({ isSignedIn: false })
    })
})
