import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { pickSpatialTarget } from '../../shared/utils/spatial'
import { chooseProfile, makeWav, PROFILE_PIN, signIn, uniqueAccount, useProfile } from './helpers'
import type { IE2eAccount } from './helpers'

test.describe.configure({ mode: 'serial' })

interface IIdName {
    id: string
}

const rect = (x: number, y: number): { x: number; y: number; width: number; height: number } => ({ x, y, width: 100, height: 50 })

test.describe('spatial navigation helper', () => {
    const grid = [rect(0, 0), rect(200, 0), rect(0, 100), rect(200, 100)]

    test('moves to the nearest neighbour in each direction', () => {
        expect(pickSpatialTarget(grid, 0, 'right')).toBe(1)
        expect(pickSpatialTarget(grid, 0, 'down')).toBe(2)
        expect(pickSpatialTarget(grid, 3, 'left')).toBe(2)
        expect(pickSpatialTarget(grid, 3, 'up')).toBe(1)
    })

    test('stays put at the edges and prefers the aligned item', () => {
        expect(pickSpatialTarget(grid, 0, 'left')).toBe(-1)
        expect(pickSpatialTarget(grid, 0, 'up')).toBe(-1)
        expect(pickSpatialTarget([rect(0, 0), rect(150, 400), rect(300, 10)], 0, 'right')).toBe(2)
    })
})

test.describe('remote and keyboard navigation', () => {
    let account: IE2eAccount
    let parent: APIRequestContext

    test.beforeAll(async ({ playwright, baseURL }) => {
        account = uniqueAccount('remote')
        parent = await playwright.request.newContext({ baseURL })
        await signIn(parent, account)
        await useProfile(parent, 'Parent')
        const member = await parent.post('/api/members', { data: { name: 'Lova', role: 'child', color: 'sky', code: { kind: 'pin', value: PROFILE_PIN } } })
        expect(member.ok(), await member.text()).toBeTruthy()
        const members = (await (await parent.get('/api/members')).json()) as (IIdName & { name: string })[]
        const parentId = members.find(item => item.name === 'Parent')!.id
        for (const title of ['Premier conte', 'Second conte']) {
            const created = await parent.post('/api/books', {
                data: { title, kind: 'multi', imageDesc: '', pageFileIds: [], lines: [{ pageIndex: 0, character: 'Perso', text: 'Texte' }] },
            })
            const { id } = (await created.json()) as IIdName
            const detail = (await (await parent.get(`/api/books/${id}`)).json()) as { lines: IIdName[] }
            const lineId = detail.lines[0]!.id
            await parent.patch(`/api/books/${id}`, { data: { lines: [{ id: lineId, memberId: parentId }] } })
            const upload = await parent.post('/api/files', { data: makeWav(300), headers: { 'content-type': 'audio/wav' } })
            const fileId = ((await upload.json()) as IIdName).id
            expect((await parent.put(`/api/books/${id}/lines/${lineId}/audio`, { data: { fileId, ms: 300 } })).ok()).toBeTruthy()
            expect((await parent.patch(`/api/books/${id}`, { data: { status: 'ready' } })).ok()).toBeTruthy()
        }
    })

    test.afterAll(async () => {
        await parent.dispose()
    })

    test('arrow keys move a visible focus ring and Enter opens the story', async ({ page }) => {
        await signIn(page.request, account)
        await chooseProfile(page, 'Lova')
        await page.goto('/kid/library')
        await expect(page.getByRole('link', { name: /Premier conte/ })).toBeVisible()
        await page.locator('body').click({ position: { x: 1, y: 1 } })
        await page.keyboard.press('ArrowDown')
        const focused = page.locator(':focus')
        await expect(focused).toHaveCount(1)
        await expect(focused).toHaveCSS('outline-style', 'solid')
        await expect(focused).toHaveCSS('outline-width', '6px')
        const before = await focused.evaluate(element => element.textContent)
        for (let i = 0; i < 4; i++) {
            await page.keyboard.press('ArrowDown')
        }
        const after = await page.locator(':focus').evaluate(element => element.textContent)
        expect(after).not.toBe(before)
        await page.getByRole('link', { name: /Premier conte/ }).focus()
        await page.keyboard.press('Enter')
        await expect(page).toHaveURL(/\/kid\/listen\//)
    })

    test('the back key leaves the player and closes the sheet first', async ({ page }) => {
        await signIn(page.request, account)
        await chooseProfile(page, 'Lova')
        await page.goto('/kid')
        await page.getByRole('link', { name: /Histoires à plusieurs voix/ }).click()
        await expect(page).toHaveURL(/\/kid\/library$/)
        await page.getByRole('button', { name: 'Fiche de Second conte' }).click()
        await expect(page.getByRole('dialog')).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(page.getByRole('dialog')).toHaveCount(0)
        await expect(page).toHaveURL(/\/kid\/library$/)
        await page.getByRole('link', { name: /Second conte/ }).click()
        await expect(page).toHaveURL(/\/kid\/listen\//)
        await page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'GoBack' })))
        await expect(page).toHaveURL(/\/kid\/library$/)
        await page.keyboard.press('Escape')
        await expect(page).toHaveURL(/\/kid$/)
    })

    test('arrow keys still type normally in the search field', async ({ page }) => {
        await signIn(page.request, account)
        await chooseProfile(page, 'Lova')
        await page.goto('/kid/library')
        const search = page.getByLabel('Rechercher un livre')
        await search.fill('abc')
        await search.press('ArrowLeft')
        await expect(search).toBeFocused()
    })
})
