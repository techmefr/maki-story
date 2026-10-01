import { expect, test } from '@playwright/test'
import { addMember, apiJson, chooseProfile, login, pngFile, unlockProfile, uniqueName, PARENT_NAME } from './helpers'

test.describe.configure({ mode: 'serial' })

test.describe('family', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
    })

    test('starts with a single parent profile', async ({ page }) => {
        const members = await apiJson<{ role: string }[]>(page, '/members')
        expect(members.some(member => member.role === 'parent')).toBeTruthy()
        await page.goto('/profiles')
        await expect(page.locator('button.card').first()).toBeVisible()
    })

    test('adds a relative, a child and another parent', async ({ page }, info) => {
        const project = info.project.name
        await addMember(page, uniqueName('Mamie', project), 'Proche')
        await addMember(page, uniqueName('Lova', project), 'Enfant')
        await addMember(page, uniqueName('Papa', project), 'Parent')
        await page.goto('/family')
        await expect(page.getByText('Enfant', { exact: true }).first()).toBeVisible()
    })

    test('uploads a photo and edits a member', async ({ page }, info) => {
        const name = uniqueName('Mamie', info.project.name)
        await page.goto('/family')
        await page.locator('a.card', { hasText: name }).click()
        await page.getByRole('button', { name: 'Changer la photo' }).click()
        await page.locator('input[type=file]').setInputFiles(pngFile('face.png'))
        await page.getByRole('button', { name: 'Garder' }).click()
        await expect(page.locator('.sheet')).toHaveCount(0)
        await page.getByPlaceholder('Maman, Mamie, Lova…').fill(`${name}-ok`)
        await page.getByLabel('coral').click()
        await page.getByRole('button', { name: 'Enregistrer' }).click()
        await expect(page).toHaveURL(/\/family$/)
        await expect(page.getByText(`${name}-ok`)).toBeVisible()
        const members = await apiJson<{ name: string; photoFileId: string | null; color: string }[]>(page, '/members')
        const edited = members.find(member => member.name === `${name}-ok`)
        expect(edited?.photoFileId).not.toBeNull()
        expect(edited?.color).toBe('coral')
        await page.locator('a.card', { hasText: `${name}-ok` }).click()
        await page.getByPlaceholder('Maman, Mamie, Lova…').fill(name)
        await page.getByRole('button', { name: 'Enregistrer' }).click()
        await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
    })

    test('requires a name to save a member', async ({ page }) => {
        await page.goto('/family/add')
        await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
    })

    test('deletes a member after confirmation', async ({ page }, info) => {
        const name = uniqueName('Temporaire', info.project.name)
        await addMember(page, name, 'Proche')
        await page.locator('a.card', { hasText: name }).click()
        page.once('dialog', dialog => dialog.dismiss())
        await page.getByRole('button', { name: 'Supprimer ce proche' }).click()
        await expect(page).toHaveURL(/\/family\//)
        page.once('dialog', dialog => dialog.accept())
        await page.getByRole('button', { name: 'Supprimer ce proche' }).click()
        await expect(page).toHaveURL(/\/family$/)
        await expect(page.getByText(name, { exact: true })).toHaveCount(0)
        const members = await apiJson<{ name: string }[]>(page, '/members')
        expect(members.some(member => member.name === name)).toBeFalsy()
    })

    test('lists members on the profile picker and opens the right space', async ({ page }, info) => {
        const child = uniqueName('Lova', info.project.name)
        await chooseProfile(page, child)
        await expect(page).toHaveURL(/\/kid/)
        await page.goto('/profiles')
        await page.locator('button.card', { hasText: PARENT_NAME }).first().click()
        await unlockProfile(page)
        await expect(page).toHaveURL(/\/home/)
    })

    test('rejects invalid member payloads', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const response = await page.request.post('/api/members', { data: { name: '', role: 'wizard', color: 'black' } })
        expect(response.status()).toBe(400)
    })
})
