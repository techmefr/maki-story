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
    firstListenedAt: string | null
    expiresAt: string | null
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
    test('a relative sends a message to a child and retries a dropped chunk', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        await chooseProfile(page, uniqueName('Mamie', project))
        await page.goto('/messages')
        await page.locator('.card', { hasText: uniqueName('Lova', project) }).getByRole('link', { name: 'Lui envoyer un message' }).click()
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
        await expect(page).toHaveURL(/\/messages/, { timeout: 10000 })
    })

    test('the relative cannot send a second message while the first one is active', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        await chooseProfile(page, uniqueName('Mamie', project))
        await page.goto('/messages')
        const card = page.locator('.card', { hasText: uniqueName('Lova', project) })
        await expect(card.getByText('Envoyé', { exact: true })).toBeVisible()
        await expect(card.getByRole('button', { name: 'Lui envoyer un message' })).toBeDisabled()
        await expect(card.getByText(/Un message attend déjà/)).toBeVisible()
    })

    test('the child listens, can replay, and the relative sees it as listened', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        await chooseProfile(page, uniqueName('Lova', project))
        await expect(page.locator('.face__bubble')).toBeVisible()
        await page.locator('.face__bubble').first().click()
        await page.getByRole('button', { name: 'Écouter' }).click()
        await expect(page.getByRole('button', { name: 'Réécouter' })).toBeVisible({ timeout: 15000 })
        await page.reload()
        await expect(page.getByRole('button', { name: 'Écouter' })).toBeVisible()
        const lova = await useProfile(page.request, uniqueName('Lova', project))
        const messages = await apiJson<IApiMessage[]>(page, '/messages')
        const heard = messages.find(message => message.toMemberId === lova)!
        expect(heard.firstListenedAt).not.toBeNull()
        expect(heard.expiresAt).not.toBeNull()
        await chooseProfile(page, uniqueName('Mamie', project))
        await page.goto('/messages')
        await expect(page.locator('.card', { hasText: uniqueName('Lova', project) }).getByText('A écouté ✓')).toBeVisible()
    })

    test('a child cannot send and a message needs a child recipient', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        const lova = await idOf(page, uniqueName('Lova', project))
        const mamie = await idOf(page, uniqueName('Mamie', project))
        await useProfile(page.request, uniqueName('Lova', project))
        const fileId = await uploadWav(page, 300)
        const fromChild = await page.request.post('/api/messages', { data: { toMemberId: mamie, fileId, mime: 'audio/wav', durationMs: 300 } })
        expect(fromChild.status()).toBe(403)
        await useProfile(page.request, uniqueName('Mamie', project))
        const toRelative = await page.request.post('/api/messages', { data: { toMemberId: mamie, fileId: await uploadWav(page, 300), mime: 'audio/wav', durationMs: 300 } })
        expect(toRelative.status()).toBe(400)
        expect(lova).not.toBe('')
    })

    test('rejects invalid messages', async ({ page }, info) => {
        await login(page)
        await useProfile(page.request, uniqueName('Mamie', info.project.name))
        const response = await page.request.post('/api/messages', { data: { toMemberId: 'a', fileId: 'f', mime: 'audio/wav' } })
        expect(response.status()).toBe(400)
    })
})
