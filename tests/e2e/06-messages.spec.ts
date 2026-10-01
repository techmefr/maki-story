import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { apiJson, chooseProfile, login, recordOnce, uniqueName, uploadWav, useProfile } from './helpers'
import type { IApiMember } from './helpers'

test.describe.configure({ mode: 'serial' })

interface IApiMessage {
    id: string
    fromMemberId: string
    toMemberId: string
    listenedAt: string | null
}

const idOf = async (page: Page, name: string): Promise<string> => {
    const members = await apiJson<IApiMember[]>(page, '/members')
    return members.find(member => member.name === name)!.id
}

const sendVoiceMessage = async (page: Page): Promise<void> => {
    await recordOnce(page, page.getByRole('button', { name: 'Enregistrer' }))
    await expect(page.getByRole('button', { name: 'Envoyer' })).toBeVisible()
    await page.getByRole('button', { name: 'Envoyer' }).click()
    await expect(page.getByText('Envoyé !')).toBeVisible()
}

test.describe('voice messages', () => {
    test('a child sends a message to a relative', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        await chooseProfile(page, uniqueName('Lova', project))
        await page.locator('.face__link', { hasText: uniqueName('Mamie', project) }).click()
        await page.getByRole('link', { name: 'Envoyer un message' }).click()
        await expect(page.getByRole('heading', { name: new RegExp('Un message pour') })).toBeVisible()
        await recordOnce(page, page.getByRole('button', { name: 'Enregistrer' }))
        await page.getByRole('button', { name: 'Refaire' }).click()
        let dropped = 0
        await page.route('**/api/uploads/*', async route => {
            if (route.request().method() === 'PATCH' && dropped < 1) {
                dropped += 1
                await route.abort('connectionreset')
                return
            }
            await route.continue()
        })
        await sendVoiceMessage(page)
        expect(dropped).toBe(1)
        await expect(page).toHaveURL(/\/kid$/, { timeout: 10000 })
        await page.locator('.face__link', { hasText: uniqueName('Mamie', project) }).click()
        await expect(page.getByText('Envoyé', { exact: true })).toBeVisible()
    })

    test('the relative sees the unread badge and listens only once', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        await chooseProfile(page, uniqueName('Mamie', project))
        await page.goto('/home')
        await expect(page.locator('a.card', { hasText: /message/ }).first()).toBeVisible()
        await expect(page.locator('.pop:visible').first()).toBeVisible()
        await page.goto('/messages')
        const card = page.locator('.card', { hasText: uniqueName('Lova', project) })
        await expect(card.getByText('Un message t’attend')).toBeVisible()
        await card.getByRole('link', { name: 'Écouter son message' }).click()
        await page.getByRole('button', { name: 'Écouter' }).click()
        await expect(page.getByRole('link', { name: 'Répondre' })).toBeVisible({ timeout: 15000 })
        await page.reload()
        await expect(page.getByText('Ce message a déjà été écouté')).toBeVisible()
        await page.goto('/messages')
        await expect(card.getByRole('link', { name: 'Écouter son message' })).toHaveCount(0)
    })

    test('the child sees the message as listened', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        await chooseProfile(page, uniqueName('Lova', project))
        await page.locator('.face__link', { hasText: uniqueName('Mamie', project) }).click()
        await expect(page.getByText('A écouté ✓')).toBeVisible()
    })

    test('the relative answers and the child listens to the reply', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        await chooseProfile(page, uniqueName('Mamie', project))
        await page.goto('/messages')
        await page.locator('.card', { hasText: uniqueName('Lova', project) }).getByRole('link', { name: 'Lui envoyer un message' }).click()
        await sendVoiceMessage(page)
        await expect(page).toHaveURL(/\/messages/, { timeout: 10000 })
        await page.getByRole('button', { name: 'Changer de profil' }).click()
        await page.locator('.sheet button.card', { hasText: uniqueName('Lova', project) }).click()
        await expect(page).toHaveURL(/\/kid$/)
        await expect(page.locator('.face__bubble')).toBeVisible()
        await page.locator('.face__bubble').click()
        await page.getByRole('button', { name: 'Écouter' }).click()
        await expect(page.getByRole('link', { name: 'Répondre' })).toBeVisible({ timeout: 15000 })
        await page.getByRole('link', { name: 'Répondre' }).click()
        await expect(page.getByRole('heading', { name: /Réponds à/ })).toBeVisible()
    })

    test('keeps only the five latest messages per conversation', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        const lova = await useProfile(page.request, uniqueName('Lova', project))
        const mamie = await idOf(page, uniqueName('Mamie', project))
        for (let i = 0; i < 7; i++) {
            const fileId = await uploadWav(page, 300)
            const response = await page.request.post('/api/messages', {
                data: { toMemberId: mamie, fileId, mime: 'audio/wav', durationMs: 300 },
            })
            expect(response.ok()).toBeTruthy()
        }
        const all = await apiJson<IApiMessage[]>(page, '/messages')
        const pair = all.filter(
            message =>
                (message.fromMemberId === lova && message.toMemberId === mamie) ||
                (message.fromMemberId === mamie && message.toMemberId === lova),
        )
        expect(pair).toHaveLength(5)
    })

    test('rejects invalid messages', async ({ page }, info) => {
        await login(page)
        await useProfile(page.request, uniqueName('Lova', info.project.name))
        const response = await page.request.post('/api/messages', { data: { toMemberId: 'a', fileId: 'f', mime: 'audio/wav' } })
        expect(response.status()).toBe(400)
    })
})
