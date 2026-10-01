import { expect, test } from '@playwright/test'
import { addMemberApi, createBookApi, inviteCode, openFamily } from './family-helpers'
import { addMember, chooseProfile, login, PARENT_NAME, uniqueName } from './helpers'

test.describe.configure({ mode: 'serial' })

test.describe('sharing, notifications and voice status screens', () => {
    test.beforeEach(async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
    })

    test('a received book shows in the bell, the inbox and the library', async ({ page, playwright, baseURL }, info) => {
        const title = uniqueName('Livre reçu', info.project.name)
        await page.goto('/sharing')
        await expect(page.getByRole('heading', { name: 'Partage entre familles' })).toBeVisible()
        const code = ((await page.locator('.code').textContent()) ?? '').trim()
        expect(code).toHaveLength(10)

        expect((await page.request.post('/api/notifications/read', { data: {} })).ok()).toBeTruthy()
        const sender = await openFamily(playwright, baseURL, 'ui-sender')
        const book = await createBookApi(sender.parent, title, ['Un', 'Deux'])
        const response = await sender.parent.post('/api/shares', { data: { bookId: book.id, code, mode: 'copy', message: 'Pour vous' } })
        expect(response.ok()).toBeTruthy()

        await page.goto('/home')
        const bell = page.getByRole('link', { name: /Notifications, 1 non lue/ })
        await expect(bell).toBeVisible()
        await bell.click()
        await expect(page.getByText(`vous a envoyé le livre « ${title} »`)).toBeVisible()
        await page.getByRole('button', { name: 'Tout marquer comme lu' }).click()
        await expect(page.getByRole('link', { name: 'Notifications', exact: true })).toBeVisible()

        await page.goto('/sharing')
        const card = page.locator('article', { hasText: title })
        await expect(card.getByText('En attente de réponse')).toBeVisible()
        await card.getByRole('button', { name: 'Accepter' }).click()
        await expect(card.getByText('Accepté')).toBeVisible()

        await page.goto('/home')
        await expect(page.getByText(title, { exact: true })).toBeVisible()
        await page.locator('div.pop-in', { hasText: title }).getByRole('button', { name: 'Partager' }).first().click()
        const dialog = page.getByRole('dialog')
        await dialog.getByLabel('Code de la famille').fill(await inviteCode(sender.parent))
        await dialog.getByRole('button', { name: 'Envoyer' }).click()
        await expect(dialog.getByText('un parent doit valider avant l’envoi')).toBeVisible()
        await dialog.getByLabel('Code de la famille').fill('inconnu123')
        await dialog.getByRole('button', { name: 'Envoyer' }).click()
        await expect(dialog.getByRole('alert')).toBeVisible()
        await sender.parent.dispose()
    })

    test('a parent shares a book and asks to record some lines', async ({ page, playwright, baseURL }, info) => {
        const target = await openFamily(playwright, baseURL, 'ui-target')
        const title = uniqueName('Livre à enregistrer', info.project.name)
        const tataId = await addMemberApi(target.parent, 'Tata', 'relative')
        expect(tataId).toBeTruthy()
        const created = await page.request.post('/api/books', {
            data: { title, kind: 'multi', imageDesc: '', pageFileIds: [], lines: [{ pageIndex: 0, character: 'Lola', text: 'Bonjour' }, { pageIndex: 0, character: 'Lola', text: 'Au revoir' }] },
        })
        expect(created.ok()).toBeTruthy()
        await page.goto('/home')
        await page.locator('div.pop-in', { hasText: title }).getByRole('button', { name: 'Partager' }).first().click()
        const dialog = page.getByRole('dialog')
        await dialog.getByLabel('Code de la famille').fill(await inviteCode(target.parent))
        await dialog.getByLabel('Enregistrer ma voix pour ce livre').check()
        await expect(dialog.getByLabel(/Bonjour/)).toBeChecked()
        await dialog.getByRole('button', { name: 'Envoyer' }).click()
        await expect(dialog.getByText(/Envoyé à la famille/)).toBeVisible()
        const incoming = (await (await target.parent.get('/api/shares')).json()) as { incoming: { bookTitle: string; lineCount: number }[] }
        expect(incoming.incoming[0]).toMatchObject({ bookTitle: title, lineCount: 2 })
        await target.parent.dispose()
    })

    test('the parent blocks a relative and sets what happens when they leave', async ({ page }, info) => {
        const name = uniqueName('Mamie bloquée', info.project.name)
        await addMember(page, name, 'Proche')
        await page.goto('/family')
        await page.locator('a.card', { hasText: name }).click()
        await expect(page.getByRole('heading', { name: 'Situation de cette voix' })).toBeVisible()
        await page.getByRole('button', { name: 'Bloqué' }).click()
        await expect(page.getByRole('button', { name: 'Bloqué' })).toHaveAttribute('aria-pressed', 'true')
        await page.getByRole('button', { name: 'Décédé' }).click()
        await expect(page.getByLabel('Bloquer ces livres pour les enfants')).toBeVisible()
        await page.getByLabel('Demander de réenregistrer ces répliques').check()
        await expect(page.getByLabel('Demander de réenregistrer ces répliques')).toBeChecked()
        await page.goto('/family')
        await expect(page.locator('a.card', { hasText: name }).getByText('décédé')).toBeVisible()
    })
})
