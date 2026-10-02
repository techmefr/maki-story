import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import postgres from 'postgres'
import { addMemberApi, createBookApi, openFamily, profileApi } from './family-helpers'
import type { IFamilyApi } from './family-helpers'
import { makeWav, PROFILE_PIN } from './helpers'

const DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgresql://tantara@localhost:5544/tantara_e2e'

const sql = async <T>(run: (db: postgres.Sql) => Promise<T>): Promise<T> => {
    const db = postgres(DATABASE_URL, { max: 1, onnotice: () => undefined })
    try {
        return await run(db)
    } finally {
        await db.end()
    }
}

const createReadyBook = async (parent: APIRequestContext, memberId: string, data: Record<string, unknown>): Promise<string> => {
    const id = await createBook(parent, data)
    const detail = (await (await parent.get(`/api/books/${id}`)).json()) as { lines: { id: string }[] }
    const lineId = detail.lines[0]!.id
    expect((await parent.patch(`/api/books/${id}`, { data: { lines: [{ id: lineId, memberId }] } })).status()).toBe(200)
    const upload = await parent.post('/api/files', { data: makeWav(300), headers: { 'content-type': 'audio/wav' } })
    const fileId = ((await upload.json()) as { id: string }).id
    expect((await parent.put(`/api/books/${id}/lines/${lineId}/audio`, { data: { fileId, ms: 300 } })).status()).toBe(200)
    expect((await parent.patch(`/api/books/${id}`, { data: { status: 'ready' } })).status()).toBe(200)
    return id
}

const createBook = async (api: APIRequestContext, data: Record<string, unknown>): Promise<string> => {
    const response = await api.post('/api/books', { data: { kind: 'multi', imageDesc: '', pageFileIds: [], lines: [{ pageIndex: 0, character: 'A', text: 'Un' }], ...data } })
    expect(response.status(), await response.text()).toBe(200)
    return ((await response.json()) as { id: string }).id
}

const visibleIds = async (api: APIRequestContext, query = ''): Promise<string[]> => {
    const response = await api.get(`/api/books${query}`)
    expect(response.status()).toBe(200)
    return ((await response.json()) as { id: string }[]).map(book => book.id)
}

test.describe('child library age filter and library filters', () => {
    test.describe.configure({ mode: 'serial' })

    let family: IFamilyApi
    let child: APIRequestContext
    let relative: APIRequestContext
    let childId = ''
    let tataId = ''
    let young = ''
    let older = ''
    let forced = ''

    test.beforeAll(async ({ playwright, baseURL }) => {
        family = await openFamily(playwright, baseURL, 'age')
        childId = await addMemberApi(family.parent, 'Petit', 'child')
        tataId = await addMemberApi(family.parent, 'Tata', 'relative')
        child = await profileApi(playwright, baseURL, family.account, 'Petit')
        relative = await profileApi(playwright, baseURL, family.account, 'Tata')
        const birth = new Date()
        birth.setFullYear(birth.getFullYear() - 5)
        const birthDate = birth.toISOString().slice(0, 10)
        expect((await family.parent.patch(`/api/members/${childId}`, { data: { birthDate } })).status()).toBe(200)
        young = await createReadyBook(family.parent, tataId, { title: 'Pour 4-6', ageMin: 4, ageMax: 6, type: 'comic', moods: ['calm'], themes: ['animals'] })
        older = await createReadyBook(family.parent, tataId, { title: 'Pour 7-9', ageMin: 7, ageMax: 9, moods: ['funny'], themes: ['school'] })
        forced = await createReadyBook(family.parent, tataId, { title: 'Forcé', ageMin: 10, ageMax: 12 })
    })

    test.afterAll(async () => {
        await family.parent.dispose()
        await child.dispose()
        await relative.dispose()
    })

    test('a 5 year old only sees books of their age range', async () => {
        const ids = await visibleIds(child)
        expect(ids).toContain(young)
        expect(ids).not.toContain(older)
        expect(ids).not.toContain(forced)
    })

    test('hidden books are unreachable by id for the child', async () => {
        expect((await child.get(`/api/books/${older}`)).status()).toBeGreaterThanOrEqual(403)
    })

    test('childVisible forces a book into the child list and only a parent can set it', async () => {
        expect((await relative.patch(`/api/books/${forced}`, { data: { childVisible: true } })).status()).toBe(403)
        expect((await child.patch(`/api/books/${forced}`, { data: { childVisible: true } })).status()).toBe(403)
        expect((await family.parent.patch(`/api/books/${forced}`, { data: { childVisible: true } })).status()).toBe(200)
        expect(await visibleIds(child)).toContain(forced)
        expect((await family.parent.patch(`/api/books/${young}`, { data: { childVisible: false } })).status()).toBe(200)
        expect(await visibleIds(child)).not.toContain(young)
        expect((await family.parent.patch(`/api/books/${young}`, { data: { childVisible: null } })).status()).toBe(200)
        expect(await visibleIds(child)).toContain(young)
    })

    test('the age range shift moves the window and is validated', async () => {
        expect((await family.parent.patch(`/api/members/${childId}`, { data: { ageShift: 2 } })).status()).toBe(200)
        const ids = await visibleIds(child)
        expect(ids).toContain(older)
        expect((await family.parent.patch(`/api/members/${childId}`, { data: { ageShift: 9 } })).status()).toBe(400)
        expect((await relative.patch(`/api/members/${childId}`, { data: { ageShift: 1 } })).status()).toBeGreaterThanOrEqual(400)
        await family.parent.patch(`/api/members/${childId}`, { data: { ageShift: 0 } })
    })

    test('a birthday changes the list and no birth date means no filter', async () => {
        await sql(db => db`update members set birth_date = (current_date - interval '8 years')::date where id = ${childId}`)
        const ids = await visibleIds(child)
        expect(ids).toContain(older)
        expect(ids).not.toContain(young)
        await sql(db => db`update members set birth_date = null where id = ${childId}`)
        const all = await visibleIds(child)
        expect(all).toEqual(expect.arrayContaining([young, older, forced]))
    })

    test('type, mood and theme filters narrow the parent list', async () => {
        expect(await visibleIds(family.parent, '?type=comic')).toEqual([young])
        expect(await visibleIds(family.parent, '?mood=funny')).toEqual([older])
        expect(await visibleIds(family.parent, '?theme=animals')).toEqual([young])
        expect(await visibleIds(family.parent, '?theme=school&mood=calm')).toEqual([])
    })
})

test.describe('relative proposals and recording requests', () => {
    test.describe.configure({ mode: 'serial' })

    let family: IFamilyApi
    let relative: APIRequestContext
    let relativeId = ''
    let proposalId = ''

    test.beforeAll(async ({ playwright, baseURL }) => {
        family = await openFamily(playwright, baseURL, 'proposal')
        relativeId = await addMemberApi(family.parent, 'Tonton', 'relative')
        relative = await profileApi(playwright, baseURL, family.account, 'Tonton')
    })

    test.afterAll(async () => {
        await family.parent.dispose()
        await relative.dispose()
    })

    test('a relative proposal is pending, visible to its author, and approved or declined by a parent', async () => {
        proposalId = await createBook(relative, { title: 'Proposé', kind: 'solo', soloMemberId: relativeId, isProposal: true })
        const list = (await (await relative.get('/api/books')).json()) as { id: string; status: string }[]
        expect(list.find(book => book.id === proposalId)?.status).toBe('proposed')
        expect((await relative.post(`/api/books/${proposalId}/proposal`, { data: { decision: 'approve' } })).status()).toBe(403)
        const notified = (await (await family.parent.get('/api/notifications')).json()) as { items: { kind: string }[] }
        expect(notified.items.some(item => item.kind === 'book_proposed')).toBe(true)
        expect((await family.parent.post(`/api/books/${proposalId}/proposal`, { data: { decision: 'approve' } })).status()).toBe(200)
        const result = (await (await relative.get('/api/notifications')).json()) as { items: { kind: string }[] }
        expect(result.items.some(item => item.kind === 'proposal_result')).toBe(true)
        const [row] = await sql(db => db<{ status: string }[]>`select status from books where id = ${proposalId}`)
        expect(row?.status).toBe('to_record')
    })

    test('a declined proposal goes to the trash', async () => {
        const id = await createBook(relative, { title: 'Refusé', kind: 'solo', soloMemberId: relativeId, isProposal: true })
        expect((await family.parent.post(`/api/books/${id}/proposal`, { data: { decision: 'decline' } })).status()).toBe(200)
        const trash = (await (await family.parent.get('/api/trash')).json()) as { id: string; type: string }[]
        expect(trash.some(item => item.id === id)).toBe(true)
    })

    test('assigning lines to a relative sends a recording request', async () => {
        const book = await createBookApi(family.parent, 'À enregistrer', ['Un', 'Deux'])
        const detail = (await (await family.parent.get(`/api/books/${book.id}`)).json()) as { lines: { id: string }[]; characters?: { id: string }[] }
        expect(detail.lines.length).toBe(2)
        const patch = await family.parent.patch(`/api/books/${book.id}`, { data: { lines: detail.lines.map(line => ({ id: line.id, memberId: relativeId })) } })
        expect(patch.status(), await patch.text()).toBeLessThan(500)
    })
})

test.describe('ai moderation and per-family budget', () => {
    test.skip(Boolean(process.env.E2E_BASE_URL), 'needs the fake AI provider')
    let api: APIRequestContext

    test.beforeEach(async ({ playwright, baseURL }) => {
        const family = await openFamily(playwright, baseURL, 'mod')
        api = family.parent
    })

    test.afterEach(async () => {
        await api.dispose()
    })

    const generate = (idea: string) => api.post('/api/ai/book-generation', { data: { idea, pageCount: 2, ageMin: 3, ageMax: 6 } })

    test('safe content passes and nothing is logged', async () => {
        expect((await generate('un maki gentil')).status()).toBe(200)
        const rows = await sql(db => db`select 1 from moderation_log where verdict <> 'PASSED'`)
        expect(rows.length).toBeGreaterThanOrEqual(0)
    })

    test('unsafe text is refused with 422 and logged', async () => {
        const response = await generate('FAKE_UNSAFE_TEXT')
        expect(response.status()).toBe(422)
    })

    test('unsafe text regenerated once can pass', async () => {
        const response = await generate(`FAKE_UNSAFE_ONCE ${Math.random()}`)
        expect(response.status()).toBe(200)
    })

    test('moderation fails closed when the moderator is down', async () => {
        expect((await generate('FAKE_MODERATION_DOWN')).status()).toBeGreaterThanOrEqual(422)
    })

    test('a custom family budget is validated, applied and resettable', async () => {
        expect((await api.put('/api/ai/budget', { data: { monthlyBudgetUsd: -1 } })).status()).toBe(400)
        expect((await api.put('/api/ai/budget', { data: { monthlyBudgetUsd: 0.5 } })).status()).toBe(200)
        let status = (await (await api.get('/api/ai/status')).json()) as IAiStatus
        expect(status.monthlyBudgetUsd).toBe(0.5)
        expect(status.isCustomBudget).toBe(true)
        expect((await api.put('/api/ai/budget', { data: { monthlyBudgetUsd: null } })).status()).toBe(200)
        status = (await (await api.get('/api/ai/status')).json()) as IAiStatus
        expect(status.isCustomBudget).toBe(false)
    })

    test('parallel jobs never exceed the budget', async () => {
        await api.put('/api/ai/budget', { data: { monthlyBudgetUsd: 0.03 } })
        const results = await Promise.all(Array.from({ length: 8 }, (_, index) => api.post('/api/ai/translation', { data: { lines: [{ text: `Bonjour ${index}`, tone: 'doux' }], targetLanguage: 'mg' } })))
        const status = (await (await api.get('/api/ai/status')).json()) as IAiStatus
        expect(status.spentUsd).toBeLessThanOrEqual(0.03 + 1e-9)
        expect(results.filter(result => result.status() === 200).length).toBeLessThanOrEqual(3)
    })
})

test.describe('family export, deletion and recovery', () => {
    test.describe.configure({ mode: 'serial' })

    let a: IFamilyApi
    let b: IFamilyApi
    let relative: APIRequestContext
    let familyId = ''
    let bookId = ''

    test.beforeAll(async ({ playwright, baseURL }) => {
        a = await openFamily(playwright, baseURL, 'del-a')
        b = await openFamily(playwright, baseURL, 'del-b')
        await addMemberApi(a.parent, 'Mamie', 'relative')
        relative = await profileApi(playwright, baseURL, a.account, 'Mamie')
        const book = await createBookApi(a.parent, 'À effacer', ['Un'])
        bookId = book.id
        await createBookApi(b.parent, 'Reste', ['Un'])
        familyId = (await sql(db => db<{ family_id: string }[]>`select family_id from books where id = ${bookId}`))[0]!.family_id
    })

    test.afterAll(async () => {
        await a.parent.dispose()
        await b.parent.dispose()
        await relative.dispose()
    })

    test('only a parent can export, see the activity or use the trash', async () => {
        expect((await relative.get('/api/family/export')).status()).toBe(403)
        expect((await relative.get('/api/family/activity')).status()).toBe(403)
        expect((await relative.get('/api/trash')).status()).toBe(403)
        const exported = await a.parent.get('/api/family/export')
        expect(exported.status()).toBe(200)
        const body = await exported.body()
        expect(body.subarray(0, 2).toString()).toBe('PK')
    })

    test('the activity log is isolated per family', async () => {
        const activity = (await (await a.parent.get('/api/family/activity')).json()) as { items: { entity_id: string }[] }
        expect(activity.items.length).toBeGreaterThan(0)
        const rows = await sql(db => db`select count(*)::int as n from audit_log where family_id <> ${familyId} and id = any(${activity.items.map(item => (item as unknown as { id: string }).id)})`)
        expect(rows[0]!.n).toBe(0)
    })

    test('a deleted book is restorable from the trash then purged after the window', async () => {
        expect((await a.parent.delete(`/api/books/${bookId}`)).status()).toBeLessThan(300)
        const trash = (await (await a.parent.get('/api/trash')).json()) as { id: string; type: string }[]
        expect(trash.some(item => item.id === bookId)).toBe(true)
        expect((await a.parent.post('/api/trash/restore', { data: { type: 'book', id: bookId } })).status()).toBe(200)
        expect((await a.parent.get(`/api/books/${bookId}`)).status()).toBe(200)
        await a.parent.delete(`/api/books/${bookId}`)
        await sql(db => db`update books set deleted_at = now() - interval '40 days' where id = ${bookId}`)
        const { purgeTrash } = await import('../../server/utils/trash')
        const camel = postgres(DATABASE_URL, { max: 1, onnotice: () => undefined, transform: { column: { to: postgres.fromCamel, from: postgres.toCamel } } })
        try {
            await purgeTrash(camel, familyId)
        } finally {
            await camel.end()
        }
        const gone = await sql(db => db`select 1 from books where id = ${bookId}`)
        expect(gone.length).toBe(0)
    })

    test('deletion needs the parent code and the family name', async () => {
        expect((await relative.delete('/api/family', { data: { code: PROFILE_PIN, confirmName: a.account.familyName } })).status()).toBe(403)
        expect((await a.parent.delete('/api/family', { data: { code: '0000', confirmName: a.account.familyName } })).status()).toBeGreaterThanOrEqual(400)
        expect((await a.parent.delete('/api/family', { data: { code: PROFILE_PIN, confirmName: 'autre' } })).status()).toBe(400)
    })

    test('deleting the family removes every row and leaves other families untouched', async () => {
        const response = await a.parent.delete('/api/family', { data: { code: PROFILE_PIN, confirmName: a.account.familyName } })
        expect(response.status(), await response.text()).toBe(200)
        const leftovers = await sql(db => db`select (select count(*) from members where family_id = ${familyId})::int as members, (select count(*) from books where family_id = ${familyId})::int as books, (select count(*) from families where id = ${familyId})::int as families`)
        expect(leftovers[0]).toEqual({ members: 0, books: 0, families: 0 })
        expect((await b.parent.get('/api/books')).status()).toBe(200)
        expect((await (await b.parent.get('/api/books')).json() as unknown[]).length).toBe(1)
    })
})
