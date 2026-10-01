import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { addMember, chooseProfile, createReadyBook, login, uniqueName, PARENT_NAME } from './helpers'

test.describe.configure({ mode: 'serial' })

const progressOf = async (page: Page, bookId: string): Promise<{ pageIndex: number } | null> => {
    const text = await (await page.request.get(`/api/books/${bookId}/progress`)).text()
    return text === '' ? null : (JSON.parse(text) as { pageIndex: number })
}

test.describe('sleep timer and resume', () => {
    let bookId = ''

    test.beforeAll(async ({ browser }, info) => {
        const page = await browser.newPage({ baseURL: info.project.use.baseURL })
        const project = info.project.name
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await addMember(page, uniqueName('Tata', project), 'Proche')
        await addMember(page, uniqueName('Sieste', project), 'Enfant')
        await addMember(page, uniqueName('Dodo', project), 'Enfant')
        bookId = await createReadyBook(page, `Histoire dodo ${project}`, 'multi', [
            { pageIndex: 0, character: 'Narrateur', text: 'Un', memberName: PARENT_NAME },
            { pageIndex: 0, character: 'Petit', text: 'Deux', memberName: uniqueName('Tata', project) },
            { pageIndex: 1, character: 'Maman', text: 'Trois', memberName: PARENT_NAME },
            { pageIndex: 1, character: 'Petit', text: 'Quatre', memberName: uniqueName('Tata', project) },
        ])
        await page.close()
    })

    test('offers to continue after leaving mid book and restarts from the beginning', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, uniqueName('Sieste', info.project.name))
        await page.goto(`/kid/listen/${bookId}`)
        await page.getByRole('button', { name: 'Lire' }).click()
        await expect(page.getByText('Page suivante')).toBeVisible({ timeout: 20000 })
        await page.getByRole('link', { name: 'Quitter' }).click()
        await expect(page).toHaveURL(/\/kid$/)
        await expect.poll(async () => (await progressOf(page, bookId))?.pageIndex).toBe(1)

        await page.goto(`/kid/listen/${bookId}`)
        await expect(page.getByRole('button', { name: 'Lire', exact: true })).toHaveCount(0)
        await page.getByRole('button', { name: 'Continuer' }).click()
        await expect(page.getByText('Page 2/2')).toBeVisible()
        await page.getByRole('link', { name: 'Quitter' }).click()
        await expect(page).toHaveURL(/\/kid$/)

        await page.goto(`/kid/listen/${bookId}`)
        await page.getByRole('button', { name: 'Au début' }).click()
        await expect(page.getByText('Page 1/2')).toBeVisible()
        await page.getByRole('link', { name: 'Quitter' }).click()
    })

    test('keeps progress per profile', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, uniqueName('Dodo', info.project.name))
        await page.goto(`/kid/listen/${bookId}`)
        await expect(page.getByRole('button', { name: 'Lire', exact: true })).toBeVisible()
        await expect(page.getByRole('button', { name: 'Continuer' })).toHaveCount(0)
        expect(await progressOf(page, bookId)).toBeNull()
    })

    test('clears progress when the book is finished', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, uniqueName('Sieste', info.project.name))
        await page.goto(`/kid/listen/${bookId}`)
        await page.getByRole('button', { name: 'Continuer' }).or(page.getByRole('button', { name: 'Lire', exact: true })).click()
        await page.getByRole('button', { name: 'Tourner la page' }).click({ timeout: 20000 })
        await expect(page.getByText('C’est fini !')).toBeVisible({ timeout: 20000 })
        await expect.poll(async () => await progressOf(page, bookId)).toBeNull()
        await page.goto(`/kid/listen/${bookId}`)
        await expect(page.getByRole('button', { name: 'Lire', exact: true })).toBeVisible()
    })

    test('the sleep timer fades out and stops playback with a good night screen', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, uniqueName('Sieste', info.project.name))
        await page.goto(`/kid/listen/${bookId}`)
        await page.getByRole('button', { name: 'Lire' }).click()
        await expect(page.getByText(/lit$/)).toBeVisible()
        await page.getByRole('button', { name: 'Minuteur de sommeil' }).click()
        await page.getByRole('button', { name: 'Dormir dans 10 minutes' }).click()
        await expect(page.getByText('Bonne nuit')).toBeVisible({ timeout: 10000 })
        await expect(page.getByRole('button', { name: 'Pause' })).toHaveCount(0)
        await expect.poll(async () => (await progressOf(page, bookId))?.pageIndex).toBeDefined()
        await page.getByRole('link', { name: 'Retour' }).click()
        await expect(page).toHaveURL(/\/kid$/)
    })

    test('a cancelled sleep timer lets the story go on', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, uniqueName('Dodo', info.project.name))
        await page.goto(`/kid/listen/${bookId}`)
        await page.getByRole('button', { name: 'Lire' }).click()
        await page.getByRole('button', { name: 'Minuteur de sommeil' }).click()
        await page.getByRole('button', { name: 'Dormir dans 10 minutes' }).click()
        await page.getByRole('button', { name: 'Minuteur de sommeil' }).click()
        await page.getByRole('button', { name: 'Annuler le minuteur' }).click()
        await expect(page.getByText('Page suivante')).toBeVisible({ timeout: 20000 })
        await expect(page.getByText('Bonne nuit')).toHaveCount(0)
    })

    test('the end of page timer sleeps at the page turn', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, uniqueName('Dodo', info.project.name))
        await page.goto(`/kid/listen/${bookId}`)
        await page.getByRole('button', { name: 'Au début' }).or(page.getByRole('button', { name: 'Lire', exact: true })).click()
        await page.getByRole('button', { name: 'Minuteur de sommeil' }).click()
        await page.getByRole('button', { name: 'Dormir à la fin de la page' }).click()
        await expect(page.getByText('Bonne nuit')).toBeVisible({ timeout: 20000 })
        expect((await progressOf(page, bookId))?.pageIndex).toBe(1)
    })
})
