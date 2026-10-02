import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { apiJson, chooseProfile, login, recordOnce, switchProfile, uniqueName, uploadWav, useProfile } from './helpers'
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
    test('the relative sends a message and the child listens only once', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        await chooseProfile(page, uniqueName('Mamie', project))
        await page.goto('/messages')
        await page.locator('.card', { hasText: uniqueName('Lova', project) }).getByRole('link', { name: 'Lui envoyer un message' }).click()
        await sendVoiceMessage(page)
        await expect(page).toHaveURL(/\/messages/, { timeout: 10000 })
        await switchProfile(page, uniqueName('Lova', project))
        await expect(page).toHaveURL(/\/kid$/)
        await page.locator('.face__bubble').click()
        await page.getByRole('button', { name: 'Écouter' }).click()
        await expect(page.getByRole('link', { name: 'Répondre' })).toHaveCount(0)
    })

    test('keeps only the five latest messages per conversation', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        const mamie = await useProfile(page.request, uniqueName('Mamie', project))
        const lova = await idOf(page, uniqueName('Lova', project))
        for (let i = 0; i < 7; i++) {
            const fileId = await uploadWav(page, 300)
            const response = await page.request.post('/api/messages', {
                data: { toMemberId: lova, fileId, mime: 'audio/wav', durationMs: 300 },
            })
            if (response.status() === 409) {
                break
            }
            expect(response.ok()).toBeTruthy()
        }
        const all = await apiJson<IApiMessage[]>(page, '/messages')
        const pair = all.filter(message => message.fromMemberId === mamie && message.toMemberId === lova)
        expect(pair.length).toBeLessThanOrEqual(5)
    })

    test('rejects invalid messages', async ({ page }, info) => {
        await login(page)
        await useProfile(page.request, uniqueName('Mamie', info.project.name))
        const response = await page.request.post('/api/messages', { data: { toMemberId: 'a', fileId: 'f', mime: 'audio/wav' } })
        expect(response.status()).toBe(400)
    })
})
