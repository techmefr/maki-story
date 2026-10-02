import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { addMember, chooseProfile, E2E_PASSWORD, PARENT_NAME, pngFile, signIn, uniqueAccount, uniqueName } from './helpers'
import type { IE2eAccount } from './helpers'

interface IMemberBody {
    id: string
    name: string
    role: string
    photoFileId: string | null
    spokenLanguages: string[]
    appLocale: string | null
}

const listMembers = async (api: APIRequestContext): Promise<IMemberBody[]> => {
    return (await (await api.get('/api/members')).json()) as IMemberBody[]
}

const memberNamed = async (api: APIRequestContext, name: string): Promise<IMemberBody> => {
    const member = (await listMembers(api)).find(item => item.name === name)
    expect(member).toBeTruthy()
    return member!
}

const startParent = async (page: Page, label: string): Promise<IE2eAccount> => {
    const account = uniqueAccount(label)
    await signIn(page.request, account)
    await chooseProfile(page, PARENT_NAME)
    return account
}

const openMenu = async (page: Page): Promise<void> => {
    await page.getByRole('button', { name: 'Mon profil' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
}

test.describe('profile menu', () => {
    test('changes the photo from the gallery', async ({ page }) => {
        await startParent(page, 'menu-photo')
        expect((await memberNamed(page.request, PARENT_NAME)).photoFileId).toBeNull()
        await openMenu(page)
        await page.getByRole('button', { name: 'Changer ma photo' }).click()
        await page.locator('input[type=file]').setInputFiles(pngFile('face.png'))
        await page.getByRole('button', { name: 'Garder' }).click()
        await expect(page.getByRole('dialog').getByRole('status')).toHaveText('Photo changée.')
        await expect.poll(async () => (await memberNamed(page.request, PARENT_NAME)).photoFileId).not.toBeNull()
        await expect(page.locator('.sheet .avatar').first()).toHaveCSS('background-image', /url\(/)
    })

    test('saves the spoken languages with Malagasy first class', async ({ page }) => {
        await startParent(page, 'menu-spoken')
        await openMenu(page)
        const malagasy = page.getByRole('button', { name: /Malagasy/ }).first()
        await expect(malagasy).toHaveAttribute('aria-pressed', 'false')
        await page.getByRole('group', { name: 'Langues parlées' }).getByRole('button', { name: /Malagasy/ }).click()
        await expect(page.getByRole('dialog').getByRole('status')).toHaveText('Enregistré.')
        await page.getByRole('group', { name: 'Langues parlées' }).getByRole('button', { name: /Français/ }).click()
        await expect.poll(async () => (await memberNamed(page.request, PARENT_NAME)).spokenLanguages).toEqual(['mg', 'fr'])
        await page.reload()
        await chooseProfile(page, PARENT_NAME)
        await openMenu(page)
        const group = page.getByRole('group', { name: 'Langues parlées' })
        await expect(group.getByRole('button', { name: /Malagasy/ })).toHaveAttribute('aria-pressed', 'true')
        await expect(group.getByRole('button', { name: /Français/ })).toHaveAttribute('aria-pressed', 'true')
        await group.getByRole('button', { name: /Malagasy/ }).click()
        await expect.poll(async () => (await memberNamed(page.request, PARENT_NAME)).spokenLanguages).toEqual(['fr'])
    })

    test('persists the app language and switches the interface', async ({ page }) => {
        await startParent(page, 'menu-locale')
        await openMenu(page)
        const group = page.getByRole('group', { name: 'Langue de l’application' })
        await expect(group.getByRole('button', { name: 'Automatique' })).toHaveAttribute('aria-pressed', 'true')
        await group.getByRole('button', { name: /Malagasy/ }).click()
        await expect(page.locator('.menu__draft')).toBeVisible()
        await expect(page.locator('html')).toHaveAttribute('lang', 'mg')
        await expect.poll(async () => (await memberNamed(page.request, PARENT_NAME)).appLocale).toBe('mg')
        await page.getByRole('dialog').locator('button.menu__chip').first().click()
        await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
        await expect.poll(async () => (await memberNamed(page.request, PARENT_NAME)).appLocale).toBeNull()
        await page.reload()
        await chooseProfile(page, PARENT_NAME)
        await openMenu(page)
        await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
        await expect(page.getByRole('group', { name: 'Langue de l’application' }).getByRole('button', { name: 'Automatique' })).toHaveAttribute('aria-pressed', 'true')
    })

    test('changes the password, refuses the old one and signs out other devices', async ({ page, playwright, baseURL }) => {
        const account = await startParent(page, 'menu-password')
        const otherDevice = await playwright.request.newContext({ baseURL })
        await signIn(otherDevice, account)
        expect((await otherDevice.get('/api/members')).ok()).toBeTruthy()
        const newPassword = `${E2E_PASSWORD}-new`
        await openMenu(page)
        await page.getByLabel('Mot de passe actuel').fill('wrong-password-1')
        await page.getByLabel('Nouveau mot de passe', { exact: true }).fill(newPassword)
        await page.getByLabel('Confirmer le nouveau mot de passe').fill(newPassword)
        await page.getByRole('button', { name: 'Changer le mot de passe' }).click()
        await expect(page.getByRole('alert')).toHaveText('Le mot de passe actuel est incorrect.')
        await page.getByLabel('Mot de passe actuel').fill(account.password)
        await page.getByLabel('Confirmer le nouveau mot de passe').fill('different-password')
        await page.getByRole('button', { name: 'Changer le mot de passe' }).click()
        await expect(page.getByRole('alert')).toHaveText('Les deux mots de passe sont différents.')
        await page.getByLabel('Confirmer le nouveau mot de passe').fill(newPassword)
        await page.getByRole('button', { name: 'Changer le mot de passe' }).click()
        await expect(page.getByText('Mot de passe changé. Les autres appareils sont déconnectés.')).toBeVisible()
        expect((await page.request.get('/api/members')).ok()).toBeTruthy()
        expect((await otherDevice.get('/api/members')).status()).toBe(401)
        const fresh = await playwright.request.newContext({ baseURL })
        const oldLogin = await fresh.post('/api/auth/login', { data: { email: account.email, password: account.password } })
        expect(oldLogin.status()).toBe(401)
        const newLogin = await fresh.post('/api/auth/login', { data: { email: account.email, password: newPassword } })
        expect(newLogin.ok()).toBeTruthy()
        expect((await fresh.get('/api/members')).ok()).toBeTruthy()
        await otherDevice.dispose()
        await fresh.dispose()
    })

    test('validates the new password on the server', async ({ page }) => {
        const account = await startParent(page, 'menu-password-rules')
        const short = await page.request.put('/api/auth/password', { data: { currentPassword: account.password, newPassword: 'short' } })
        expect(short.status()).toBe(400)
        const same = await page.request.put('/api/auth/password', { data: { currentPassword: account.password, newPassword: account.password } })
        expect(same.status()).toBe(400)
        const wrong = await page.request.put('/api/auth/password', { data: { currentPassword: 'nope-nope-1', newPassword: 'another-password-1' } })
        expect(wrong.status()).toBe(403)
    })

    test('gives a child a reduced menu and keeps settings scoped', async ({ page, playwright, baseURL }, info) => {
        const child = uniqueName('Lova', info.project.name)
        const relativeName = uniqueName('Tante', info.project.name)
        await startParent(page, 'menu-child')
        await addMember(page, child, 'Enfant')
        await addMember(page, relativeName, 'Proche')
        const childMember = await memberNamed(page.request, child)
        const relative = await memberNamed(page.request, relativeName)
        const parent = await memberNamed(page.request, PARENT_NAME)

        const asParent = await page.request.patch(`/api/members/${childMember.id}/settings`, { data: { spokenLanguages: ['mg', 'fr'], appLocale: 'fr' } })
        expect(asParent.ok()).toBeTruthy()
        const forbiddenOnRelative = await page.request.patch(`/api/members/${relative.id}/settings`, { data: { spokenLanguages: ['fr'] } })
        expect(forbiddenOnRelative.status()).toBe(403)
        const invalid = await page.request.patch(`/api/members/${parent.id}/settings`, { data: { spokenLanguages: ['xx'] } })
        expect(invalid.status()).toBe(400)

        await chooseProfile(page, child)
        await openMenu(page)
        const dialog = page.getByRole('dialog')
        await expect(dialog.getByRole('button', { name: 'Changer ma photo' })).toBeVisible()
        await expect(dialog.getByText('Malagasy')).toBeVisible()
        await expect(dialog.getByText('Mot de passe du compte')).toHaveCount(0)
        await expect(dialog.getByText('Langue de l’application')).toHaveCount(0)
        await expect(dialog.getByRole('group', { name: 'Langues parlées' })).toHaveCount(0)

        const password = await page.request.put('/api/auth/password', { data: { currentPassword: 'x', newPassword: 'another-password-1' } })
        expect(password.status()).toBe(403)
        const ownLanguages = await page.request.patch(`/api/members/${childMember.id}/settings`, { data: { spokenLanguages: ['en'] } })
        expect(ownLanguages.status()).toBe(403)
        const ownLocale = await page.request.patch(`/api/members/${childMember.id}/settings`, { data: { appLocale: 'en' } })
        expect(ownLocale.status()).toBe(403)
        const otherProfile = await page.request.patch(`/api/members/${parent.id}/settings`, { data: { spokenLanguages: ['en'] } })
        expect(otherProfile.status()).toBe(403)
        const ownPhoto = await page.request.put(`/api/members/${childMember.id}/photo`, { data: pngFile('c.png').buffer, headers: { 'content-type': 'image/png' } })
        expect(ownPhoto.ok()).toBeTruthy()
        const otherPhoto = await page.request.put(`/api/members/${parent.id}/photo`, { data: pngFile('c.png').buffer, headers: { 'content-type': 'image/png' } })
        expect(otherPhoto.status()).toBe(403)

        const stranger = await playwright.request.newContext({ baseURL })
        await signIn(stranger, uniqueAccount('menu-stranger'))
        const strangerMembers = await listMembers(stranger)
        const strangerPatch = await stranger.patch(`/api/members/${childMember.id}/settings`, { data: { spokenLanguages: ['fr'] } })
        expect([403, 404]).toContain(strangerPatch.status())
        expect(strangerMembers.some(item => item.id === childMember.id)).toBe(false)
        await stranger.dispose()
    })

    test('defaults the book language to the first spoken language', async ({ page }) => {
        await startParent(page, 'menu-book-language')
        const parent = await memberNamed(page.request, PARENT_NAME)
        expect((await page.request.patch(`/api/members/${parent.id}/settings`, { data: { spokenLanguages: ['mg', 'fr'] } })).ok()).toBeTruthy()
        await page.goto('/books/new')
        await expect(page.getByLabel('Langue du livre')).toContainText('Malagasy')
    })

    test('lets a parent set a child spoken languages from the family form', async ({ page }, info) => {
        const child = uniqueName('Rado', info.project.name)
        await startParent(page, 'menu-form')
        await addMember(page, child, 'Enfant')
        const created = await memberNamed(page.request, child)
        await page.goto(`/family/${created.id}`)
        await page.getByRole('group', { name: 'Langues parlées' }).getByRole('button', { name: /Malagasy/ }).click()
        await page.getByRole('button', { name: 'Enregistrer' }).click()
        await expect.poll(async () => (await memberNamed(page.request, child)).spokenLanguages).toEqual(['mg'])
    })
})
