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
    await expect(page.getByText(/Message envoyé à/)).toBeVisible()
}

test.describe('voice messages', () => {
    test('a relative sends a message to a child and retries a dropped chunk', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        await chooseProfile(page, uniqueName('Mamie', project))
        const everyone = (await (await page.request.get('/api/members')).json()) as { id: string; name: string }[]
        await page.goto(`/message/${everyone.find(member => member.name === uniqueName('Lova', project))!.id}`)
        await expect(page.getByRole('heading', { name: /Laisser un message/ })).toBeVisible()
        await recordOnce(page, page.getByRole('button', { name: 'Enregistrer' }))
        await page.getByRole('button', { name: 'Réenregistrer' }).click()
        await page.waitForTimeout(1300)
        await page.getByRole('button', { name: 'Arrêter' }).click()
        let dropped = 0
        await page.route('**/api/uploads/*', async route => {
            if (route.request().method() === 'PATCH' && dropped < 1) {
                dropped += 1
                await route.abort('connectionreset')
                return
            }
            await route.continue()
        })
        await page.getByRole('button', { name: 'Envoyer' }).click()
        await expect(page.getByText(/Message envoyé à/)).toBeVisible()
        expect(dropped).toBe(1)
    })

    test('the relative sees the counter of active messages for the child', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        await chooseProfile(page, uniqueName('Mamie', project))
        await page.goto('/messages')
        await expect(page.getByText('1/5').first()).toBeVisible()
    })

    test('the child listens, can replay, and the relative sees it as listened', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        await chooseProfile(page, uniqueName('Lova', project))
        const face = page.locator('.face__link', { hasText: uniqueName('Mamie', project) })
        await expect(face).toHaveAttribute('data-ring', 'unheard')
        await face.click()
        await page.getByRole('link', { name: 'Écouter son message' }).click()
        await expect(page.getByTestId('message-player')).toBeVisible()
        await expect(page).toHaveURL(/\/kid\/[^/]+$/, { timeout: 15000 })
        await expect(page.locator('.face__link', { hasText: uniqueName('Mamie', project) })).toHaveCount(0)
        await page.goto('/kid')
        const heardFace = page.locator('.face__link', { hasText: uniqueName('Mamie', project) })
        await expect(heardFace).toHaveAttribute('data-ring', 'heard')
        await heardFace.click()
        await page.getByRole('link', { name: 'Écouter son message' }).click()
        await expect(page.getByTestId('message-player')).toBeVisible()
        await expect(page.getByTestId('message-toggle')).toBeVisible()
        const lova = await useProfile(page.request, uniqueName('Lova', project))
        const messages = await apiJson<IApiMessage[]>(page, '/messages')
        const heard = messages.find(message => message.toMemberId === lova)!
        expect(heard.firstListenedAt).not.toBeNull()
        expect(heard.expiresAt).not.toBeNull()
    })

    test('a child writes to an adult and an adult message needs a child recipient', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        const lova = await idOf(page, uniqueName('Lova', project))
        const mamie = await idOf(page, uniqueName('Mamie', project))
        await useProfile(page.request, uniqueName('Lova', project))
        const fileId = await uploadWav(page, 300)
        const fromChild = await page.request.post('/api/messages', { data: { toMemberId: mamie, fileId, mime: 'audio/wav', durationMs: 300 } })
        expect(fromChild.status()).toBe(200)
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
