import { expect, test } from '@playwright/test'
import { chooseProfile, createReadyBook, ensureParentProfile, login, uniqueName, PARENT_NAME } from './helpers'

test.describe.configure({ mode: 'serial' })

test.describe('kid space', () => {
    let multiId = ''
    let soloId = ''

    test.beforeAll(async ({ browser }, info) => {
        const page = await browser.newPage({ baseURL: info.project.use.baseURL })
        const project = info.project.name
        await login(page)
        await ensureParentProfile(page.request)
        const mamie = uniqueName('Mamie', project)
        const lova = uniqueName('Lova', project)
        const known = (await (await page.request.get('/api/members')).json()) as { name: string }[]
        for (const [name, role] of [[mamie, 'relative'], [lova, 'child']] as const) {
            if (!known.some(member => member.name === name)) {
                const created = await page.request.post('/api/members', { data: { name, role, color: role === 'child' ? 'sky' : 'pink', code: role === 'child' ? { kind: 'symbols', value: '0000' } : { kind: 'pin', value: '123456' } } })
                expect(created.ok(), await created.text()).toBeTruthy()
            }
        }
        multiId = await createReadyBook(page, `Histoire multi ${project}`, 'multi', [
            { pageIndex: 0, character: 'Narrateur', text: 'Un', memberName: PARENT_NAME },
            { pageIndex: 0, character: 'Petit', text: 'Deux', memberName: lova },
            { pageIndex: 1, character: 'Maman', text: 'Trois', memberName: mamie },
        ])
        soloId = await createReadyBook(page, `Histoire solo ${project}`, 'solo', [
            { pageIndex: 0, character: '', text: 'Solo un', memberName: mamie },
            { pageIndex: 0, character: '', text: 'Solo deux', memberName: mamie },
        ])
        await page.close()
    })

    test('shows the relatives faces and opens a relative page', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        await chooseProfile(page, uniqueName('Lova', project))
        await expect(page).toHaveURL(/\/kid$/)
        await expect(page.getByRole('heading', { name: /Coucou/ })).toBeVisible()
        await expect(page.getByText('Histoires à plusieurs voix')).toHaveCount(0)
        await expect(page.getByTestId('book-search-open')).toHaveCount(0)
        await page.locator('.face__link', { hasText: uniqueName('Mamie', project) }).click()
        await expect(page.getByTestId('kid-send-message')).toBeVisible()
        await expect(page.getByRole('link', { name: `Histoire solo ${project}` })).toBeVisible()
        await expect(page.getByRole('link', { name: `Histoire multi ${project}` })).toBeVisible()
    })

    test('plays a single voice story to the end', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, uniqueName('Lova', info.project.name))
        await page.goto(`/kid/listen/${soloId}`)
        await expect(page.getByRole('button', { name: 'Lire' })).toBeVisible()
        await page.getByRole('button', { name: 'Lire' }).click()
        await expect(page.getByText(/lit$/)).toBeVisible()
        await expect(page.getByText('C’est fini !')).toBeVisible({ timeout: 20000 })
        await page.getByRole('button', { name: 'Recommencer' }).click()
        await expect(page.getByText(/lit$/)).toBeVisible()
        await page.getByRole('link', { name: 'Quitter' }).click()
        await expect(page).toHaveURL(/\/kid$/)
    })

    test('plays a multi voice book with the page turn screen', async ({ page }, info) => {
        const project = info.project.name
        await login(page)
        await chooseProfile(page, uniqueName('Lova', project))
        await page.goto('/kid/library')
        await expect(page.getByRole('link', { name: new RegExp(`Histoire multi ${project}`) })).toBeVisible()
        await page.getByRole('link', { name: new RegExp(`Histoire multi ${project}`) }).click()
        await page.getByRole('button', { name: 'Lire' }).click()
        await expect(page.getByText('Page 1/2')).toBeVisible()
        await expect(page.getByText('Page suivante')).toBeVisible({ timeout: 20000 })
        await page.getByRole('button', { name: 'Tourner la page' }).click()
        await expect(page.getByText('Page 2/2')).toBeVisible()
        await expect(page.getByText('C’est fini !')).toBeVisible({ timeout: 20000 })
        await page.getByRole('link', { name: 'Retour' }).click()
        await expect(page).toHaveURL(/\/kid$/)
    })

    test('the reader has no pause button', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, uniqueName('Lova', info.project.name))
        await page.goto(`/kid/listen/${multiId}`)
        await page.getByRole('button', { name: 'Lire' }).click()
        await expect(page.getByRole('button', { name: 'Pause' })).toHaveCount(0)
    })

    test('a child cannot reach the adult screens', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, uniqueName('Lova', info.project.name))
        for (const path of ['/home', '/family', '/books/new', '/messages']) {
            await page.goto(path)
            await expect(page).toHaveURL(/\/kid$/)
        }
    })
})
