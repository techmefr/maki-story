import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import type { IBook, IBookSummary } from '../../shared/types/book'
import type { IBookActivity, INewVoices, IReviewComment } from '../../shared/types/review'
import type { INotificationList } from '../../shared/types/share'
import { apiJson, chooseProfile, makeWav, PROFILE_PIN, recordAndSend, signIn, switchProfile, uniqueAccount, useProfile } from './helpers'

interface IIdName {
    id: string
}

interface IFixture {
    parent: APIRequestContext
    mamie: APIRequestContext
    tonton: APIRequestContext
    lova: APIRequestContext
    ids: { parent: string; mamie: string; tonton: string; lova: string }
}

const asProfile = async (
    playwright: { request: { newContext: (options: { baseURL?: string }) => Promise<APIRequestContext> } },
    baseURL: string | undefined,
    account: ReturnType<typeof uniqueAccount>,
    name: string,
): Promise<APIRequestContext> => {
    const api = await playwright.request.newContext({ baseURL })
    await signIn(api, account)
    await useProfile(api, name)
    return api
}

const upload = async (api: APIRequestContext): Promise<string> => {
    const response = await api.post('/api/files', { data: makeWav(700), headers: { 'content-type': 'audio/wav' } })
    expect(response.ok()).toBeTruthy()
    return ((await response.json()) as IIdName).id
}

const putTake = async (api: APIRequestContext, bookId: string, lineId: string): Promise<void> => {
    const response = await api.put(`/api/books/${bookId}/lines/${lineId}/audio`, { data: { fileId: await upload(api), ms: 700 } })
    expect(response.status(), await response.text()).toBe(200)
}

const getBook = async (api: APIRequestContext, bookId: string): Promise<IBook> => (await (await api.get(`/api/books/${bookId}`)).json()) as IBook

const statusOf = (book: IBook, lineId: string): string | undefined => book.recordings.find(item => item.lineId === lineId)?.status

const createBook = async (parent: APIRequestContext, title: string, castIds: string[]): Promise<{ id: string; lineIds: string[] }> => {
    const created = await parent.post('/api/books', {
        data: {
            title,
            kind: 'multi',
            imageDesc: '',
            pageFileIds: [],
            lines: castIds.map((_, index) => ({ pageIndex: 0, character: `Perso ${index}`, text: `Réplique numéro ${index + 1}` })),
        },
    })
    expect(created.ok()).toBeTruthy()
    const { id } = (await created.json()) as IIdName
    const book = await getBook(parent, id)
    const patched = await parent.patch(`/api/books/${id}`, {
        data: { lines: book.lines.map((line, index) => ({ id: line.id, memberId: castIds[index] })) },
    })
    expect(patched.ok()).toBeTruthy()
    return { id, lineIds: book.lines.map(line => line.id) }
}

const notificationsOf = async (api: APIRequestContext): Promise<INotificationList> => (await (await api.get('/api/notifications')).json()) as INotificationList

const review = (parent: APIRequestContext, bookId: string, lineId: string, data: object) =>
    parent.post(`/api/books/${bookId}/lines/${lineId}/review`, { data })

const summaryOf = async (api: APIRequestContext, bookId: string): Promise<IBookSummary | undefined> => {
    const list = (await (await api.get('/api/books')).json()) as IBookSummary[]
    return list.find(item => item.id === bookId)
}

test.describe('book review through the API', () => {
    let fixture: IFixture
    let bookId = ''
    let lineIds: string[] = []

    test.beforeAll(async ({ playwright, baseURL }) => {
        const account = uniqueAccount('review')
        const parent = await asProfile(playwright, baseURL, account, 'Parent')
        const ids = { parent: '', mamie: '', tonton: '', lova: '' }
        ids.parent = ((await (await parent.get('/api/members')).json()) as (IIdName & { name: string })[]).find(member => member.name === 'Parent')!.id
        for (const [key, name, role] of [
            ['mamie', 'Mamie', 'relative'],
            ['tonton', 'Tonton', 'relative'],
            ['lova', 'Lova', 'child'],
        ] as const) {
            const response = await parent.post('/api/members', { data: { name, role, color: 'coral', code: { kind: 'pin', value: PROFILE_PIN } } })
            expect(response.status(), await response.text()).toBe(200)
            ids[key] = ((await response.json()) as IIdName).id
        }
        fixture = {
            parent,
            ids,
            mamie: await asProfile(playwright, baseURL, account, 'Mamie'),
            tonton: await asProfile(playwright, baseURL, account, 'Tonton'),
            lova: await asProfile(playwright, baseURL, account, 'Lova'),
        }
        const created = await createBook(parent, 'Livre relu', [ids.mamie, ids.mamie, ids.tonton])
        bookId = created.id
        lineIds = created.lineIds
    })

    test.afterAll(async () => {
        await Promise.all([fixture.parent.dispose(), fixture.mamie.dispose(), fixture.tonton.dispose(), fixture.lova.dispose()])
    })

    test('takes stay drafts until the relative sends them, then one grouped notification counts them', async () => {
        const { parent, mamie, tonton } = fixture
        await putTake(mamie, bookId, lineIds[0]!)
        expect(statusOf(await getBook(parent, bookId), lineIds[0]!)).toBe('draft')
        expect(((await (await mamie.post(`/api/books/${bookId}/submit`, { data: {} })).json()) as { submitted: number }).submitted).toBe(1)
        await putTake(mamie, bookId, lineIds[1]!)
        expect(((await (await mamie.post(`/api/books/${bookId}/submit`, { data: {} })).json()) as { submitted: number }).submitted).toBe(1)
        expect(((await (await mamie.post(`/api/books/${bookId}/submit`, { data: {} })).json()) as { submitted: number }).submitted).toBe(0)
        await putTake(tonton, bookId, lineIds[2]!)
        await tonton.post(`/api/books/${bookId}/submit`, { data: {} })
        const book = await getBook(parent, bookId)
        expect(book.status).toBe('in_review')
        expect(book.recordings.every(item => item.status === 'submitted')).toBe(true)
        const notices = await notificationsOf(parent)
        const own = notices.items.filter(item => item.kind === 'recording_batch' && item.payload.bookId === bookId)
        expect(own).toHaveLength(2)
        expect(own.map(item => item.count).sort()).toEqual([1, 2])
        expect(notices.unreadCount).toBeGreaterThanOrEqual(2)
        expect((await summaryOf(parent, bookId))?.submittedCount).toBe(3)
    })

    test('the book stays hidden from the child until it is validated', async () => {
        const { lova } = fixture
        expect(((await (await lova.get('/api/books')).json()) as IIdName[]).some(item => item.id === bookId)).toBe(false)
        expect((await lova.get(`/api/books/${bookId}`)).status()).toBe(404)
    })

    test('a relative or a child cannot review, validate or force a ready status', async () => {
        const { mamie, lova, parent, ids } = fixture
        for (const api of [mamie, lova]) {
            expect((await review(api, bookId, lineIds[0]!, { action: 'approve' })).status()).toBe(403)
            expect((await api.post(`/api/books/${bookId}/validate-all`, { data: {} })).status()).toBe(403)
        }
        expect((await lova.post(`/api/books/${bookId}/submit`, { data: {} })).status()).toBe(403)
        expect((await parent.post(`/api/books/${bookId}/submit`, { data: {} })).status()).toBe(403)
        expect((await lova.get(`/api/books/${bookId}/comments`)).status()).toBe(403)
        expect((await mamie.get(`/api/books/${bookId}/activity`)).status()).toBe(403)
        const solo = await mamie.post('/api/books', {
            data: { title: 'Solo de Mamie', kind: 'solo', soloMemberId: ids.mamie, imageDesc: '', pageFileIds: [], lines: [{ pageIndex: 0, character: '', text: 'Bonjour.' }] },
        })
        const { id: soloId } = (await solo.json()) as IIdName
        expect((await mamie.patch(`/api/books/${soloId}`, { data: { status: 'ready' } })).status()).toBe(403)
        expect((await mamie.patch(`/api/books/${soloId}`, { data: { status: 'in_review' } })).status()).toBe(403)
    })

    test('a comment is required to send a line back, and only that relative sees it', async () => {
        const { parent, mamie, tonton } = fixture
        expect((await review(parent, bookId, lineIds[0]!, { action: 'request_changes' })).status()).toBe(400)
        expect((await review(parent, bookId, lineIds[0]!, { action: 'request_changes', comment: '   ' })).status()).toBe(400)
        const sent = await review(parent, bookId, lineIds[0]!, { action: 'request_changes', comment: 'Plus doucement, comme un secret.' })
        expect(sent.status(), await sent.text()).toBe(200)
        expect(statusOf(await getBook(parent, bookId), lineIds[0]!)).toBe('changes_requested')
        const mamieComments = (await (await mamie.get(`/api/books/${bookId}/comments`)).json()) as IReviewComment[]
        expect(mamieComments).toHaveLength(1)
        expect(mamieComments[0]).toMatchObject({ lineId: lineIds[0], body: 'Plus doucement, comme un secret.', resolvedAt: null })
        expect(((await (await tonton.get(`/api/books/${bookId}/comments`)).json()) as IReviewComment[]).length).toBe(0)
        const summary = await summaryOf(parent, bookId)
        expect(summary?.changesRequestedCount).toBe(1)
        const notices = await notificationsOf(mamie)
        const result = notices.items.find(item => item.kind === 'review_result' && item.payload.bookId === bookId)
        expect(result).toMatchObject({ isRead: false, payload: { returned: 1, approved: 0 } })
    })

    test('the whole book cannot be validated while a line waits for a new take', async () => {
        const response = await fixture.parent.post(`/api/books/${bookId}/validate-all`, { data: {} })
        expect(response.status()).toBe(409)
    })

    test('the relative redoes only the flagged line and it returns to submitted', async () => {
        const { parent, mamie } = fixture
        await putTake(mamie, bookId, lineIds[0]!)
        const book = await getBook(parent, bookId)
        expect(statusOf(book, lineIds[0]!)).toBe('submitted')
        expect(statusOf(book, lineIds[1]!)).toBe('submitted')
        const comments = (await (await parent.get(`/api/books/${bookId}/comments`)).json()) as IReviewComment[]
        expect(comments[0]!.resolvedAt).not.toBeNull()
        expect((await summaryOf(parent, bookId))?.changesRequestedCount).toBe(0)
    })

    test('line by line approval, then the whole book is validated and reaches the child', async () => {
        const { parent, lova } = fixture
        const approved = await review(parent, bookId, lineIds[1]!, { action: 'approve' })
        expect(await approved.json()).toMatchObject({ status: 'approved', isBookReady: false })
        expect((await getBook(parent, bookId)).status).toBe('in_review')
        const validated = await parent.post(`/api/books/${bookId}/validate-all`, { data: {} })
        expect(validated.status(), await validated.text()).toBe(200)
        const book = (await validated.json()) as IBook
        expect(book.status).toBe('ready')
        expect(book.recordings.every(item => item.status === 'approved')).toBe(true)
        expect(((await (await lova.get('/api/books')).json()) as IIdName[]).some(item => item.id === bookId)).toBe(true)
        const asChild = await getBook(lova, bookId)
        expect(asChild.lines.every(line => line.audioFileId !== null)).toBe(true)
    })

    test('approving every line one by one validates the book without the bulk action', async ({ }) => {
        const { parent, mamie, ids } = fixture
        const single = await createBook(parent, 'Livre ligne à ligne', [ids.mamie, ids.mamie])
        for (const lineId of single.lineIds) {
            await putTake(mamie, single.id, lineId)
        }
        await mamie.post(`/api/books/${single.id}/submit`, { data: {} })
        expect(await (await review(parent, single.id, single.lineIds[0]!, { action: 'approve' })).json()).toMatchObject({ isBookReady: false })
        expect(await (await review(parent, single.id, single.lineIds[1]!, { action: 'approve' })).json()).toMatchObject({ isBookReady: true })
        expect((await getBook(parent, single.id)).status).toBe('ready')
    })

    test('editing a line marks its take stale, blocks validation and shows in the activity', async () => {
        const { parent, mamie } = fixture
        const patched = await parent.patch(`/api/books/${bookId}`, { data: { lines: [{ id: lineIds[1], text: 'Un texte tout neuf.' }] } })
        expect(patched.ok()).toBeTruthy()
        const book = await getBook(parent, bookId)
        expect(statusOf(book, lineIds[1]!)).toBe('stale')
        expect(statusOf(book, lineIds[0]!)).toBe('approved')
        expect((await parent.post(`/api/books/${bookId}/validate-all`, { data: {} })).status()).toBe(409)
        const activity = (await (await parent.get(`/api/books/${bookId}/activity`)).json()) as IBookActivity
        expect(activity.items.some(item => item.kind === 'stale' && item.lineId === lineIds[1])).toBe(true)
        expect((await review(parent, bookId, lineIds[1]!, { action: 'approve' })).status()).toBe(409)
        await putTake(mamie, bookId, lineIds[1]!)
        await mamie.post(`/api/books/${bookId}/submit`, { data: {} })
        expect(statusOf(await getBook(parent, bookId), lineIds[1]!)).toBe('submitted')
    })

    test('the activity feed shows what is new since the last visit and keeps the history', async () => {
        const { parent } = fixture
        const first = (await (await parent.get(`/api/books/${bookId}/activity`)).json()) as IBookActivity
        expect(first.lastSeenAt).toBeNull()
        expect(first.newCount).toBeGreaterThan(5)
        expect(first.items.map(item => item.kind)).toEqual(expect.arrayContaining(['submitted', 'changes_requested', 'resubmitted', 'approved', 'validated', 'stale']))
        expect(first.items.find(item => item.kind === 'changes_requested')?.body).toBe('Plus doucement, comme un secret.')
        expect((await parent.post(`/api/books/${bookId}/seen`, { data: {} })).ok()).toBeTruthy()
        const second = (await (await parent.get(`/api/books/${bookId}/activity`)).json()) as IBookActivity
        expect(second.lastSeenAt).not.toBeNull()
        expect(second.newCount).toBe(0)
        expect(second.items.length).toBe(first.items.length)
        await review(parent, bookId, lineIds[1]!, { action: 'approve' })
        const third = (await (await parent.get(`/api/books/${bookId}/activity`)).json()) as IBookActivity
        expect(third.newCount).toBe(1)
        expect(third.items[0]).toMatchObject({ kind: 'approved', isNew: true })
    })

    test('a new voice on a book the child can play appears in a text free feed for the child', async () => {
        const { parent, mamie, tonton, lova, ids } = fixture
        const book = await createBook(parent, 'Livre nouvelle voix', [ids.parent, ids.tonton])
        await putTake(parent, book.id, book.lineIds[0]!)
        await putTake(tonton, book.id, book.lineIds[1]!)
        await tonton.post(`/api/books/${book.id}/submit`, { data: {} })
        expect((await parent.post(`/api/books/${book.id}/validate-all`, { data: {} })).ok()).toBeTruthy()
        expect(((await (await lova.get('/api/activity/new-voices')).json()) as INewVoices[]).some(item => item.bookId === book.id)).toBe(false)
        await parent.patch(`/api/books/${book.id}`, { data: { lines: [{ id: book.lineIds[0], memberId: ids.mamie }] } })
        await putTake(mamie, book.id, book.lineIds[0]!)
        await mamie.post(`/api/books/${book.id}/submit`, { data: {} })
        const pending = await getBook(lova, book.id)
        expect(pending.lines[0]!.audioFileId).toBeNull()
        expect((await review(parent, book.id, book.lineIds[0]!, { action: 'approve' })).ok()).toBeTruthy()
        expect((await getBook(lova, book.id)).lines[0]!.audioFileId).not.toBeNull()
        const voices = (await (await lova.get('/api/activity/new-voices')).json()) as INewVoices[]
        expect(voices.find(item => item.bookId === book.id)?.memberIds).toEqual([ids.mamie])
        const feed = (await (await lova.get(`/api/books/${book.id}/activity`)).json()) as IBookActivity
        expect(feed.items.every(item => item.kind === 'voice_added' && item.body === '')).toBe(true)
        expect(feed.items.map(item => item.subjectMemberId)).toEqual([ids.mamie])
        await lova.post(`/api/books/${book.id}/seen`, { data: {} })
        expect(((await (await lova.get('/api/activity/new-voices')).json()) as INewVoices[]).some(item => item.bookId === book.id)).toBe(false)
    })
})

const openReview = async (page: Page, title: string): Promise<void> => {
    await page.goto('/library')
    await page.locator('a.book', { hasText: title }).first().click()
    await expect(page).toHaveURL(/\/review$/)
}

test.describe('book review in the interface', () => {
    test('parent reviews line by line, the relative redoes the flagged line, the parent validates the book for the child', async ({ page, playwright, baseURL }) => {
        test.setTimeout(180_000)
        const account = uniqueAccount('review-ui')
        const parent = await asProfile(playwright, baseURL, account, 'Parent')
        const members: Record<string, string> = {}
        for (const [name, role] of [['Mamie', 'relative'], ['Lova', 'child']] as const) {
            const response = await parent.post('/api/members', { data: { name, role, color: 'coral', code: { kind: 'pin', value: PROFILE_PIN } } })
            members[name] = ((await response.json()) as IIdName).id
        }
        const created = await createBook(parent, 'Histoire du matin', [members.Mamie!, members.Mamie!])
        const mamie = await asProfile(playwright, baseURL, account, 'Mamie')
        for (const lineId of created.lineIds) {
            await putTake(mamie, created.id, lineId)
        }
        await mamie.post(`/api/books/${created.id}/submit`, { data: {} })

        await signIn(page.request, account)
        await chooseProfile(page, 'Parent')
        await page.goto('/library')
        const card = page.locator('a.book', { hasText: 'Histoire du matin' }).first()
        await expect(card.getByTestId('review-dot')).toBeVisible()
        await page.goto('/notifications')
        await expect(page.getByText('Mamie a fini d’enregistrer 2 répliques de « Histoire du matin »')).toBeVisible()
        await openReview(page, 'Histoire du matin')

        await expect(page.getByTestId('book-status')).toHaveText('En relecture')
        await expect(page.getByTestId('voice-progress').first()).toContainText('0/2 validées')
        await expect(page.getByRole('button', { name: 'À relire (2)' })).toBeVisible()
        const size = await page.getByRole('button', { name: 'Valider tout le livre' }).boundingBox()
        expect(size!.height).toBeGreaterThanOrEqual(44)
        await expect(page.getByRole('button', { name: /^Écouter la réplique/ }).first()).toBeEnabled()

        await page.getByRole('button', { name: 'Demander de refaire la réplique page 1' }).first().click()
        await page.getByLabel('Ce qu’il faut changer').fill('Plus lentement, avec un grand sourire.')
        await page.getByRole('button', { name: 'Envoyer la demande' }).click()
        await expect(page.getByText('Plus lentement, avec un grand sourire.')).toBeVisible()
        await expect(page.getByRole('button', { name: 'À refaire (1)' })).toBeVisible()
        await page.getByRole('button', { name: 'À refaire (1)' }).click()
        await expect(page.locator('[data-line-state="changes"]')).toHaveCount(1)
        await page.getByRole('button', { name: 'Tout (2)' }).click()
        await page.getByRole('button', { name: 'Approuver la réplique page 1' }).last().click()
        await expect(page.getByRole('button', { name: 'Validées (1)' })).toBeVisible()
        await expect(page.getByTestId('voice-progress').first()).toContainText('1/2 validées')
        await expect(page.getByRole('button', { name: 'Valider tout le livre' })).toBeDisabled()

        await page.goto('/library')
        await switchProfile(page, 'Mamie')
        await page.goto('/notifications')
        await expect(page.getByText('« Histoire du matin » : 1 validée, 1 à refaire')).toBeVisible()
        await page.goto(`/books/${created.id}/studio`)
        await expect(page.getByRole('button', { name: 'À refaire (1)' })).toBeVisible()
        await page.getByRole('button', { name: 'À refaire (1)' }).click()
        await expect(page.getByTestId('line-comment')).toContainText('Plus lentement, avec un grand sourire.')
        await recordAndSend(page)
        await expect(page.getByRole('button', { name: 'À refaire (0)' })).toBeVisible()

        await page.goto('/library')
        await switchProfile(page, 'Parent')
        await openReview(page, 'Histoire du matin')
        await expect(page.getByRole('button', { name: 'À relire (1)' })).toBeVisible()
        await page.getByRole('button', { name: 'Valider tout le livre' }).click()
        await expect(page.getByTestId('book-status')).toHaveText('Prêt')
        const seenAfterVisit = page.waitForResponse(response => response.url().includes('/seen'))
        await page.getByRole('link', { name: 'Activité' }).click()
        await expect(page.getByTestId('activity-summary')).toContainText('nouveauté')
        await expect(page.getByText('a validé le livre')).toBeVisible()
        await seenAfterVisit
        await page.reload()
        await expect(page.getByTestId('activity-summary')).toHaveText('Rien de nouveau depuis ta dernière visite')

        await page.goto('/library')
        await switchProfile(page, 'Lova')
        await page.goto('/kid/library')
        await expect(page.getByText('Histoire du matin')).toBeVisible()
        await parent.dispose()
        await mamie.dispose()
    })

    test('a stale line is flagged in the review page and in the relative studio', async ({ page, playwright, baseURL }) => {
        test.setTimeout(120_000)
        const account = uniqueAccount('review-stale')
        const parent = await asProfile(playwright, baseURL, account, 'Parent')
        const response = await parent.post('/api/members', { data: { name: 'Mamie', role: 'relative', color: 'coral', code: { kind: 'pin', value: PROFILE_PIN } } })
        const { id: mamieId } = (await response.json()) as IIdName
        const created = await createBook(parent, 'Texte qui change', [mamieId])
        const mamie = await asProfile(playwright, baseURL, account, 'Mamie')
        await putTake(mamie, created.id, created.lineIds[0]!)
        await mamie.post(`/api/books/${created.id}/submit`, { data: {} })
        await parent.patch(`/api/books/${created.id}`, { data: { lines: [{ id: created.lineIds[0], text: 'Le texte a été corrigé.' }] } })

        await signIn(page.request, account)
        await chooseProfile(page, 'Parent')
        await page.goto(`/books/${created.id}/review`)
        await expect(page.getByText('Texte modifié, à refaire')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Valider tout le livre' })).toBeDisabled()
        await page.goto('/library')
        await switchProfile(page, 'Mamie')
        await page.goto(`/books/${created.id}/studio`)
        await expect(page.getByTestId('stale-notice')).toBeVisible()
        await expect(page.getByRole('button', { name: 'À refaire (1)' })).toBeVisible()
        expect((await apiJson<IBook>(page, `/books/${created.id}`)).recordings[0]!.status).toBe('stale')
        await parent.dispose()
        await mamie.dispose()
    })

})
