import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { chooseProfile, makeWav, PROFILE_PIN, signIn, uniqueAccount, useProfile } from './helpers'
import type { IE2eAccount } from './helpers'

test.describe.configure({ mode: 'serial' })

interface IIdName {
    id: string
}

interface IBookRow {
    id: string
    title: string
    readerIds: string[]
}

interface IBookExtra {
    subtitle?: string
    author?: string
    language?: string
    ageMin?: number
    ageMax?: number
}

const asProfile = async (api: APIRequestContext, account: IE2eAccount, name: string): Promise<void> => {
    await signIn(api, account)
    await useProfile(api, name)
}

const createBook = async (
    api: APIRequestContext,
    title: string,
    extra: IBookExtra,
    casting: { memberId: string; recorded: boolean }[],
): Promise<{ id: string; lineIds: string[] }> => {
    const created = await api.post('/api/books', {
        data: {
            title,
            kind: 'multi',
            imageDesc: '',
            pageFileIds: [],
            lines: casting.map((_item, index) => ({ pageIndex: 0, character: `Perso ${index}`, text: `Texte ${index}` })),
            ...extra,
        },
    })
    expect(created.ok(), await created.text()).toBeTruthy()
    const { id } = (await created.json()) as IIdName
    const detail = (await (await api.get(`/api/books/${id}`)).json()) as { lines: IIdName[] }
    const lineIds = detail.lines.map(line => line.id)
    const patched = await api.patch(`/api/books/${id}`, { data: { lines: lineIds.map((lineId, index) => ({ id: lineId, memberId: casting[index]!.memberId })) } })
    expect(patched.ok(), await patched.text()).toBeTruthy()
    for (const [index, lineId] of lineIds.entries()) {
        if (!casting[index]!.recorded) {
            continue
        }
        const upload = await api.post('/api/files', { data: makeWav(300), headers: { 'content-type': 'audio/wav' } })
        const fileId = ((await upload.json()) as IIdName).id
        const put = await api.put(`/api/books/${id}/lines/${lineId}/audio`, { data: { fileId, ms: 300 } })
        expect(put.ok(), await put.text()).toBeTruthy()
    }
    return { id, lineIds }
}

const setStatus = async (api: APIRequestContext, id: string, status: string): Promise<void> => {
    const response = await api.patch(`/api/books/${id}`, { data: { status } })
    expect(response.ok(), await response.text()).toBeTruthy()
}

const listBooks = async (api: APIRequestContext, query = ''): Promise<{ rows: IBookRow[]; total: number }> => {
    const response = await api.get(`/api/books${query}`)
    expect(response.ok()).toBeTruthy()
    return { rows: (await response.json()) as IBookRow[], total: Number(response.headers()['x-total-count']) }
}

test.describe('library', () => {
    let account: IE2eAccount
    let parent: APIRequestContext
    let child: APIRequestContext
    let ids = { mamie: '', tonton: '', lova: '', parent: '' }
    const books: Record<string, string> = {}

    test.beforeAll(async ({ playwright, baseURL }) => {
        account = uniqueAccount('library')
        parent = await playwright.request.newContext({ baseURL })
        await asProfile(parent, account, 'Parent')
        for (const [key, name, role] of [
            ['mamie', 'Mamie', 'relative'],
            ['tonton', 'Tonton', 'relative'],
            ['lova', 'Lova', 'child'],
        ] as const) {
            const response = await parent.post('/api/members', { data: { name, role, color: key === 'mamie' ? 'coral' : 'sky', code: { kind: 'pin', value: PROFILE_PIN } } })
            expect(response.ok(), await response.text()).toBeTruthy()
            ids[key] = ((await response.json()) as IIdName).id
        }
        const members = (await (await parent.get('/api/members')).json()) as (IIdName & { name: string })[]
        ids.parent = members.find(member => member.name === 'Parent')!.id
        const voiced = await createBook(
            parent,
            'Le zébu voyageur',
            { subtitle: 'Un grand voyage', author: 'Rabe', language: 'mg', ageMin: 4, ageMax: 6 },
            [
                { memberId: ids.mamie, recorded: true },
                { memberId: ids.tonton, recorded: true },
            ],
        )
        books.voiced = voiced.id
        await setStatus(parent, voiced.id, 'ready')
        const silent = await createBook(parent, 'Le livre muet', { ageMin: 7, ageMax: 9 }, [{ memberId: ids.mamie, recorded: false }])
        books.silent = silent.id
        await setStatus(parent, silent.id, 'ready')
        const stale = await createBook(parent, 'Le livre périmé', { author: 'Rabe' }, [{ memberId: ids.mamie, recorded: true }])
        books.stale = stale.id
        await setStatus(parent, stale.id, 'ready')
        const edit = await parent.patch(`/api/books/${stale.id}`, { data: { lines: [{ id: stale.lineIds[0], text: 'Nouveau texte' }] } })
        expect(edit.ok(), await edit.text()).toBeTruthy()
        const draft = await createBook(parent, 'Le brouillon', { ageMin: 0, ageMax: 3 }, [{ memberId: ids.mamie, recorded: true }])
        books.draft = draft.id
        await setStatus(parent, draft.id, 'to_record')
        const todo = await createBook(parent, 'Le livre à faire', {}, [{ memberId: ids.mamie, recorded: false }])
        await setStatus(parent, todo.id, 'to_record')
        child = await playwright.request.newContext({ baseURL })
        await asProfile(child, account, 'Lova')
    })

    test.afterAll(async () => {
        await parent.dispose()
        await child.dispose()
    })

    test('a child only sees validated books with a recorded voice', async () => {
        const { rows } = await listBooks(child)
        expect(rows.map(row => row.title)).toEqual(['Le zébu voyageur'])
        expect(rows[0]!.readerIds.sort()).toEqual([ids.mamie, ids.tonton].sort())
        const hidden = await child.get(`/api/books/${books.silent}`)
        expect(hidden.status()).toBe(404)
        const stale = await child.get(`/api/books/${books.stale}`)
        expect(stale.status()).toBe(404)
    })

    test('a parent sees every book and can filter on the server', async () => {
        const all = await listBooks(parent)
        expect(all.total).toBe(5)
        expect((await listBooks(parent, '?q=zebu')).rows).toHaveLength(0)
        expect((await listBooks(parent, '?q=z%C3%A9bu')).rows.map(row => row.title)).toEqual(['Le zébu voyageur'])
        expect((await listBooks(parent, '?q=rabe')).rows).toHaveLength(2)
        expect((await listBooks(parent, '?q=grand%20voyage')).rows).toHaveLength(1)
        expect((await listBooks(parent, '?language=mg')).rows).toHaveLength(1)
        expect((await listBooks(parent, '?age=4-6')).rows.map(row => row.title)).toEqual(['Le zébu voyageur'])
        expect((await listBooks(parent, '?age=0-3')).rows.map(row => row.title)).toEqual(['Le brouillon'])
        expect((await listBooks(parent, '?age=10%2B')).rows).toHaveLength(0)
        expect((await listBooks(parent, '?q=%25')).rows).toHaveLength(0)
        const page = await listBooks(parent, '?limit=2&offset=1')
        expect(page.rows).toHaveLength(2)
        expect(page.total).toBe(5)
    })

    test('a relative only sees the books with a line assigned to them', async ({ playwright, baseURL }) => {
        const relative = await playwright.request.newContext({ baseURL })
        await asProfile(relative, account, 'Tonton')
        const { rows } = await listBooks(relative)
        expect(rows.map(row => row.title)).toEqual(['Le zébu voyageur'])
        await relative.dispose()
    })

    const openAs = async (page: Page, name: string): Promise<void> => {
        await signIn(page.request, account)
        await chooseProfile(page, name)
    }

    test('the parent home groups books in rows and filters them', async ({ page }) => {
        await openAs(page, 'Parent')
        await page.goto('/home')
        await expect(page.getByRole('heading', { name: /À enregistrer/ })).toBeVisible()
        await expect(page.getByRole('heading', { name: /En cours d’enregistrement/ })).toBeVisible()
        await expect(page.getByRole('heading', { name: /Tous nos livres/ })).toBeVisible()
        const everything = page.getByRole('region', { name: /Tous nos livres/ })
        await expect(everything.getByRole('link')).toHaveCount(5)
        await page.getByLabel('Rechercher un livre').fill('zébu')
        await expect(everything.getByRole('link')).toHaveCount(1)
        await page.getByLabel('Rechercher un livre').fill('')
        await page.getByRole('button', { name: '4-6 ans' }).click()
        await expect(everything.getByRole('link')).toHaveCount(1)
        await expect(page.getByRole('button', { name: '4-6 ans' })).toHaveAttribute('aria-pressed', 'true')
        await page.getByRole('button', { name: '4-6 ans' }).click()
        await page.getByLabel('Langue').selectOption('mg')
        await expect(everything.getByRole('link')).toHaveCount(1)
        await page.getByLabel('Langue').selectOption('en')
        await expect(page.getByText('Aucun livre ne correspond')).toBeVisible()
    })

    test('the book sheet lists every relative who recorded a voice', async ({ page }) => {
        await openAs(page, 'Parent')
        await page.goto('/home')
        await page.getByRole('region', { name: /Tous nos livres/ }).getByRole('button', { name: 'Fiche de Le zébu voyageur' }).click()
        const sheet = page.getByRole('dialog', { name: /Fiche de Le zébu voyageur/ })
        await expect(sheet.getByRole('heading', { name: 'Le zébu voyageur' })).toBeVisible()
        await expect(sheet.getByText('Un grand voyage')).toBeVisible()
        await expect(sheet.getByText('Rabe')).toBeVisible()
        await expect(sheet.getByText('4-6 ans')).toBeVisible()
        await expect(sheet.getByText('Malgache')).toBeVisible()
        const readers = sheet.getByRole('list').getByRole('listitem')
        await expect(readers).toHaveCount(2)
        await expect(readers.filter({ hasText: 'Mamie' })).toHaveCount(1)
        await expect(readers.filter({ hasText: 'Tonton' })).toHaveCount(1)
        await page.keyboard.press('Escape')
        await expect(sheet).toHaveCount(0)
    })

    test('the child library lists only the playable book and its sheet', async ({ page }) => {
        await openAs(page, 'Lova')
        await page.goto('/kid/library')
        await expect(page.getByRole('link', { name: /Le zébu voyageur/ })).toBeVisible()
        await expect(page.getByRole('link', { name: /Le livre muet|Le livre périmé|Le brouillon/ })).toHaveCount(0)
        await page.getByLabel('Rechercher un livre').fill('introuvable')
        await expect(page.getByText('Aucune histoire pour l’instant.')).toBeVisible()
        await page.getByLabel('Rechercher un livre').fill('rabe')
        await expect(page.getByRole('link', { name: /Le zébu voyageur/ })).toBeVisible()
        await page.getByRole('button', { name: 'Fiche de Le zébu voyageur' }).click()
        const sheet = page.getByRole('dialog')
        await expect(sheet.getByText('Lu par')).toBeVisible()
        await expect(sheet.getByRole('link', { name: 'Écouter' })).toBeVisible()
    })
})
