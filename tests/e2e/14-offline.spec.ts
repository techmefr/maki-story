import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { addMember, chooseProfile, createReadyBook, login, openSwitcher, uniqueName, PARENT_NAME } from './helpers'

test.describe.configure({ mode: 'serial' })

const offlineBookCount = (page: Page): Promise<number> =>
    page.evaluate(
        () =>
            new Promise<number>(resolve => {
                const opening = indexedDB.open('tantara-offline')
                opening.onupgradeneeded = () => {
                    opening.result.createObjectStore('books', { keyPath: 'id' })
                    opening.result.createObjectStore('kv')
                }
                opening.onsuccess = () => {
                    const counting = opening.result.transaction('books').objectStore('books').count()
                    counting.onsuccess = () => resolve(counting.result)
                }
            }),
    )

const cachedFileCount = (page: Page): Promise<number> =>
    page.evaluate(async () => (await caches.has('tantara-offline-audio')) ? (await (await caches.open('tantara-offline-audio')).keys()).length : 0)

test.describe('offline books', () => {
    let title = ''
    let childName = ''

    test.beforeAll(async ({ browser }, info) => {
        const page = await browser.newPage({ baseURL: info.project.use.baseURL })
        const project = info.project.name
        title = `Offline ${project}`
        childName = uniqueName('LovaOff', project)
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await addMember(page, childName, 'Enfant')
        await createReadyBook(page, title, 'multi', [
            { pageIndex: 0, character: 'Narrateur', text: 'Un', memberName: PARENT_NAME },
            { pageIndex: 0, character: 'Petit', text: 'Deux', memberName: childName },
        ])
        await page.close()
    })

    test('a parent downloads a book then plays it without a connection', async ({ page, context }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.goto('/home')
        await page.getByRole('link', { name: new RegExp(title) }).click()
        await expect(page.getByRole('heading', { name: title })).toBeVisible()
        await page.getByRole('button', { name: 'Télécharger' }).click()
        await expect(page.getByText(/Disponible hors ligne · /)).toBeVisible()
        await context.setOffline(true)
        await expect(page.getByText('Pas de connexion', { exact: false })).toBeVisible()
        await page.getByRole('link', { name: 'Retour' }).click()
        await expect(page.getByRole('button', { name: /Nouveau livre/ })).toBeDisabled()
        await page.getByRole('link', { name: new RegExp(title) }).click()
        await expect(page.getByRole('heading', { name: title })).toBeVisible()
        await page.getByRole('button', { name: 'Lecture' }).click()
        await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
        await context.setOffline(false)
    })

    test('a child listens to a downloaded story offline', async ({ page, context }) => {
        await login(page)
        await chooseProfile(page, childName)
        await page.goto('/kid/library')
        const card = page.locator(`[data-offline-card="${title}"]`)
        await card.getByRole('button', { name: 'Télécharger' }).click()
        await expect(card.getByText(/Disponible hors ligne · /)).toBeVisible()
        await context.setOffline(true)
        await page.getByRole('link', { name: new RegExp(title) }).click()
        await page.getByRole('button', { name: 'Lire' }).click()
        await expect(page.getByText(/lit$/)).toBeVisible()
        await expect(page.getByText('Page suivante').or(page.getByText('C’est fini !'))).toBeVisible({ timeout: 20000 })
        await context.setOffline(false)
    })

    test('the storage screen lists the book and deleting it frees the space', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.goto('/home')
        await page.getByRole('link', { name: new RegExp(title) }).click()
        await expect(page.getByRole('heading', { name: title })).toBeVisible()
        await page.getByRole('button', { name: 'Télécharger' }).click()
        await expect(page.getByText(/Disponible hors ligne · /)).toBeVisible()
        await page.getByRole('link', { name: 'Retour' }).click()
        await page.getByRole('link', { name: 'Famille' }).first().click()
        await page.getByRole('link', { name: 'Stockage hors ligne' }).click()
        await expect(page.getByRole('heading', { name: 'Stockage hors ligne' })).toBeVisible()
        await expect(page.locator('[data-offline-book]', { hasText: title })).toBeVisible()
        expect(await cachedFileCount(page)).toBeGreaterThan(0)
        await page.getByRole('button', { name: 'Tout supprimer' }).click()
        await expect(page.getByText('Aucun livre téléchargé')).toBeVisible()
        expect(await cachedFileCount(page)).toBe(0)
        expect(await offlineBookCount(page)).toBe(0)
    })

    test('signing out clears the offline data', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.goto('/home')
        await page.getByRole('link', { name: new RegExp(title) }).click()
        await expect(page.getByRole('heading', { name: title })).toBeVisible()
        await page.getByRole('button', { name: 'Télécharger' }).click()
        await expect(page.getByText(/Disponible hors ligne · /)).toBeVisible()
        expect(await offlineBookCount(page)).toBe(1)
        await openSwitcher(page)
        await page.getByRole('button', { name: 'Se déconnecter' }).click()
        await expect(page).toHaveURL(/\/login/)
        expect(await offlineBookCount(page)).toBe(0)
        expect(await cachedFileCount(page)).toBe(0)
    })
})

test.describe('connectivity detection', () => {
    const banner = (page: Page) => page.getByText('Pas de connexion', { exact: false })
    const newBook = (page: Page) => page.getByRole('link', { name: /Nouveau livre/ })

    test.beforeEach(async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.goto('/home')
        await expect(newBook(page)).toBeVisible()
    })

    test('going offline then online recovers by itself', async ({ page, context }) => {
        await context.setOffline(true)
        await expect(banner(page)).toBeVisible()
        await expect(page.getByRole('button', { name: /Nouveau livre/ })).toBeDisabled()
        await context.setOffline(false)
        await expect(banner(page)).toBeHidden({ timeout: 15000 })
        await expect(newBook(page)).toBeVisible()
    })

    test('a wrong navigator.onLine never blocks the app while the server answers', async ({ page }) => {
        await page.addInitScript(() => Object.defineProperty(Navigator.prototype, 'onLine', { get: () => false, configurable: true }))
        await page.goto('/home')
        await page.evaluate(() => window.dispatchEvent(new Event('offline')))
        await expect(newBook(page)).toBeVisible()
        await expect(banner(page)).toBeHidden()
        await newBook(page).click()
        await expect(page).toHaveURL(/\/books\/new/)
    })

    test('an unreachable API shows the banner and the retry button recovers', async ({ page }) => {
        await page.route('**/api/**', route => route.abort())
        await page.evaluate(() => window.dispatchEvent(new Event('offline')))
        await expect(banner(page)).toBeVisible()
        await expect(page.getByRole('button', { name: /Nouveau livre/ })).toBeDisabled()
        await page.unroute('**/api/**')
        await page.getByRole('button', { name: 'Réessayer' }).click()
        await expect(banner(page)).toBeHidden()
        await expect(newBook(page)).toBeVisible()
    })

    test('a server error is not reported as offline', async ({ page }) => {
        await page.route('**/api/auth/me', route => route.fulfill({ status: 500, body: '{}' }))
        await page.evaluate(() => window.dispatchEvent(new Event('offline')))
        await page.waitForTimeout(1000)
        await expect(banner(page)).toBeHidden()
        await expect(newBook(page)).toBeVisible()
    })
})
