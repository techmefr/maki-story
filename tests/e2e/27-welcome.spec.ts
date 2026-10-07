import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import type { IMember } from '../../shared/types/member'
import { enterPin, inviteByLink, PARENT_NAME, PROFILE_PIN, uniqueAccount } from './helpers'
import type { IE2eAccount } from './helpers'

const registerThroughForm = async (page: Page, account: IE2eAccount): Promise<void> => {
    await page.goto('/register')
    await page.getByLabel('E-mail').fill(account.email)
    await page.getByLabel('Mot de passe').fill(account.password)
    await page.getByLabel('Nom de la famille').fill(account.familyName)
    await page.getByLabel('Votre prénom').fill(PARENT_NAME)
    await page.getByRole('button', { name: 'Créer mon compte' }).click()
    await expect(page).toHaveURL(/\/welcome/)
}

const setParentCode = async (page: Page): Promise<void> => {
    await expect(page.getByRole('heading', { name: 'Protège le mode parent' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Crée ton code' })).toBeVisible()
    await enterPin(page, PROFILE_PIN)
    await expect(page.getByRole('heading', { name: 'Confirme ton code' })).toBeVisible()
    await enterPin(page, PROFILE_PIN)
    await expect(page.getByRole('heading', { name: 'Qui écoute les histoires ?' })).toBeVisible()
}

test.describe('guided first launch', () => {
    test('creates the family, the parent code, a child, skips the invitation and lands on the parent home', async ({ page }) => {
        const account = uniqueAccount('welcome')
        await registerThroughForm(page, account)
        await expect(page.getByTestId('welcome-progress')).toContainText('Étape 1 sur 4')
        await setParentCode(page)
        await expect(page.getByTestId('welcome-progress')).toContainText('Étape 2 sur 4')
        await expect(page.getByTestId('welcome-children-next')).toBeDisabled()

        await page.getByTestId('welcome-child-name').fill('Lova')
        await page.getByTestId('welcome-child-birth').fill('2020-05-17')
        for (const shape of ['Étoile', 'Rond', 'Cœur', 'Carré']) {
            await page.getByRole('button', { name: shape }).click()
        }
        await page.getByRole('button', { name: 'OK' }).click()
        await page.getByTestId('welcome-child-save').click()
        await expect(page.getByTestId('welcome-children')).toContainText('Lova')
        await expect(page.getByTestId('welcome-children-next')).toBeEnabled()

        await page.getByTestId('welcome-children-next').click()
        await expect(page.getByRole('heading', { name: 'Invite un premier proche' })).toBeVisible()
        await expect(page.getByTestId('welcome-invite-next')).toContainText('Plus tard')
        await page.getByTestId('welcome-invite-next').click()

        await expect(page.getByRole('heading', { name: 'Tout est prêt !' }).or(page.getByText('Tout est prêt !')).first()).toBeVisible()
        await page.getByTestId('welcome-finish').click()
        await expect(page).toHaveURL(/\/home/)

        const members = (await (await page.request.get('/api/members')).json()) as (IMember & { birthDate?: string | null })[]
        const child = members.find(member => member.name === 'Lova')!
        expect(child.role).toBe('child')
        expect(child.birthDate).toBe('2020-05-17')
        expect(child.hasCode).toBe(true)
    })

    test('the invitation step can create a link and the flow still finishes', async ({ page }) => {
        const account = uniqueAccount('welcome-invite')
        await registerThroughForm(page, account)
        await setParentCode(page)
        await page.getByTestId('welcome-children-skip').click()
        await expect(page.getByRole('heading', { name: 'Invite un premier proche' })).toBeVisible()
        await inviteByLink(page)
        await expect(page.getByTestId('invite-link')).toHaveValue(/\/join\/[a-z0-9]{6}$/)
        await expect(page.getByTestId('welcome-invite-next')).toContainText('Continuer')
        await page.getByTestId('welcome-invite-next').click()
        await page.getByTestId('welcome-finish').click()
        await expect(page).toHaveURL(/\/home/)
        const invitations = (await (await page.request.get('/api/invitations')).json()) as unknown[]
        expect(invitations).toHaveLength(1)
    })

    test('stays inside the viewport in right-to-left and with the largest text', async ({ page }) => {
        await page.addInitScript(() => {
            window.localStorage.setItem('tantara-locale', 'ar')
            window.localStorage.setItem('tantara-text-size', 'max')
        })
        const account = uniqueAccount('welcome-rtl')
        await page.goto('/register')
        await page.locator('input[type="email"]').fill(account.email)
        await page.locator('input[type="password"]').fill(account.password)
        const texts = page.locator('input[type="text"]')
        await texts.nth(0).fill(account.familyName)
        await texts.nth(1).fill(PARENT_NAME)
        await page.locator('form button[type="submit"]').click()
        await expect(page).toHaveURL(/\/welcome/)
        await page.reload()
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl')
        await expect(page.locator('html')).toHaveAttribute('data-text-size', 'max')
        await expect(page.getByTestId('welcome-progress')).toBeVisible()
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
        expect(overflow).toBeLessThanOrEqual(1)
    })
})
