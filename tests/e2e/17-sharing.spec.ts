import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import type { IBook, IBookSummary } from '../../shared/types/book'
import type { IMember } from '../../shared/types/member'
import type { IFamilyInvite, INotification, INotificationList, IShareBook, IShareLists } from '../../shared/types/share'
import { MAX_FAMILIES_PER_BOOK } from '../../shared/utils/sharing'
import { addMemberApi, createBookApi, inviteCode, openFamily, profileApi, uploadAudio } from './family-helpers'
import type { IFamilyApi } from './family-helpers'

interface IShareResult {
    id: string
    status: string
}

const shareBook = (api: APIRequestContext, data: object): Promise<Awaited<ReturnType<APIRequestContext['post']>>> => api.post('/api/shares', { data })

const lists = async (api: APIRequestContext): Promise<IShareLists> => (await (await api.get('/api/shares')).json()) as IShareLists

const notifications = async (api: APIRequestContext): Promise<INotificationList> => {
    return (await (await api.get('/api/notifications')).json()) as INotificationList
}

test.describe('sharing between families', () => {
    test.describe.configure({ mode: 'serial' })

    let a: IFamilyApi
    let b: IFamilyApi
    let c: IFamilyApi
    let tata: APIRequestContext
    let cousin: APIRequestContext
    let mamie: APIRequestContext
    let tataId = ''
    let mamieId = ''
    let codeB = ''
    let codeC = ''
    let book: { id: string; lineIds: string[] }
    let recordShareId = ''
    let copiedBookId = ''

    test.beforeAll(async ({ playwright, baseURL }) => {
        a = await openFamily(playwright, baseURL, 'share-a')
        b = await openFamily(playwright, baseURL, 'share-b')
        c = await openFamily(playwright, baseURL, 'share-c')
        tataId = await addMemberApi(b.parent, 'Tata', 'relative')
        await addMemberApi(b.parent, 'Cousin', 'relative')
        mamieId = await addMemberApi(a.parent, 'Mamie', 'relative')
        tata = await profileApi(playwright, baseURL, b.account, 'Tata')
        cousin = await profileApi(playwright, baseURL, b.account, 'Cousin')
        mamie = await profileApi(playwright, baseURL, a.account, 'Mamie')
        codeB = await inviteCode(b.parent)
        codeC = await inviteCode(c.parent)
        book = await createBookApi(a.parent, 'Livre partagé', ['Un', 'Deux', 'Trois'])
    })

    test.afterAll(async () => {
        await Promise.all([a, b, c].map(family => family.parent.dispose()))
        await Promise.all([tata, cousin, mamie].map(api => api.dispose()))
    })

    test('the invite code belongs to parents and can be rotated and revoked', async () => {
        expect((await tata.get('/api/family/invite')).status()).toBe(403)
        expect((await tata.post('/api/family/invite/rotate')).status()).toBe(403)
        expect((await tata.delete('/api/family/invite')).status()).toBe(403)
        const rotated = (await (await c.parent.post('/api/family/invite/rotate')).json()) as IFamilyInvite
        expect(rotated.code).not.toBe(codeC)
        expect(rotated.isRevoked).toBe(false)
        const withOld = await shareBook(a.parent, { bookId: book.id, code: codeC, mode: 'copy' })
        expect(withOld.status()).toBe(404)
        expect((await c.parent.delete('/api/family/invite')).status()).toBe(200)
        expect(((await (await c.parent.get('/api/family/invite')).json()) as IFamilyInvite).isRevoked).toBe(true)
        expect((await shareBook(a.parent, { bookId: book.id, code: rotated.code, mode: 'copy' })).status()).toBe(404)
        const renewed = (await (await c.parent.post('/api/family/invite/rotate')).json()) as IFamilyInvite
        expect(renewed.isRevoked).toBe(false)
        codeC = renewed.code
    })

    test('a request to record only the chosen lines reaches the other family', async () => {
        const [first, second] = book.lineIds
        const created = await shareBook(a.parent, { bookId: book.id, code: codeB, mode: 'record', lineIds: [first, second], message: 'Coucou' })
        expect(created.status(), await created.text()).toBe(200)
        const result = (await created.json()) as IShareResult
        expect(result.status).toBe('pending')
        recordShareId = result.id
        expect((await shareBook(a.parent, { bookId: book.id, code: codeB, mode: 'record', lineIds: [first] })).status()).toBe(409)
        const incoming = (await lists(b.parent)).incoming
        expect(incoming).toHaveLength(1)
        expect(incoming[0]).toMatchObject({ bookTitle: 'Livre partagé', mode: 'record', lineCount: 2, status: 'pending' })
        const inbox = await notifications(b.parent)
        expect(inbox.unreadCount).toBe(1)
        expect(inbox.items[0]).toMatchObject({ kind: 'share_received', isRead: false })
        expect((await tata.post(`/api/shares/${recordShareId}/accept`)).status()).toBe(403)
        expect((await a.parent.post(`/api/shares/${recordShareId}/accept`)).status()).toBe(404)
        expect((await tata.get(`/api/shares/${recordShareId}/book`)).status()).toBe(404)
    })

    test('the accepted relative sees and records only the requested lines', async () => {
        const [first, second, third] = book.lineIds
        const accepted = await b.parent.post(`/api/shares/${recordShareId}/accept`, { data: { recorderMemberId: tataId } })
        expect(accepted.status(), await accepted.text()).toBe(200)
        expect((await cousin.get(`/api/shares/${recordShareId}/book`)).status()).toBe(404)
        const view = (await (await tata.get(`/api/shares/${recordShareId}/book`)).json()) as IShareBook
        expect(view.lines.map(line => line.id)).toEqual([first, second])
        expect(JSON.stringify(view)).not.toContain('Trois')
        expect((await tata.put(`/api/shares/${recordShareId}/lines/${third}/audio`, { data: { fileId: await uploadAudio(tata), language: 'fr' } })).status()).toBe(404)
        expect((await tata.put(`/api/shares/${recordShareId}/lines/${first}/audio`, { data: { fileId: 'unknown' } })).status()).toBe(400)
        for (const lineId of [first, second]) {
            const put = await tata.put(`/api/shares/${recordShareId}/lines/${lineId}/audio`, { data: { fileId: await uploadAudio(tata), ms: 300, language: 'fr' } })
            expect(put.status(), await put.text()).toBe(200)
        }
        expect((await tata.put(`/api/shares/${recordShareId}/lines/${first}/audio`, { data: { fileId: await uploadAudio(tata), ms: 300, language: 'fr' } })).status()).toBe(200)
        const after = (await (await tata.get(`/api/shares/${recordShareId}/book`)).json()) as IShareBook
        expect(after.lines.every(line => line.hasRecording)).toBe(true)
    })

    test('the owner receives submitted recordings as a guest voice and one grouped notification', async () => {
        const detail = (await (await a.parent.get(`/api/books/${book.id}`)).json()) as IBook
        expect(detail.recordings).toHaveLength(2)
        expect(detail.recordings.every(recording => recording.status === 'submitted')).toBe(true)
        const members = (await (await a.parent.get('/api/members')).json()) as IMember[]
        const guest = members.find(member => member.isGuest)
        expect(guest).toMatchObject({ name: 'Tata', role: 'relative', status: 'active' })
        expect(detail.recordings.every(recording => recording.memberId === guest!.id)).toBe(true)
        const inbox = await notifications(a.parent)
        const batch = inbox.items.find(item => item.kind === 'voice_batch')
        expect(batch).toMatchObject({ count: 3, isRead: false })
        expect(batch!.payload).toMatchObject({ fromName: 'Tata', bookTitle: 'Livre partagé' })
        expect((await tata.get('/api/members')).status()).toBe(200)
        const profile = await a.parent.post('/api/auth/profile', { data: { memberId: guest!.id, code: '1234' } })
        expect(profile.status()).toBe(404)
    })

    test('a guest voice cannot sign in, receive messages or be reached by other families', async () => {
        const detail = (await (await a.parent.get(`/api/books/${book.id}`)).json()) as IBook
        const fileId = detail.recordings[0]!.fileId
        const members = (await (await a.parent.get('/api/members')).json()) as IMember[]
        const guest = members.find(member => member.isGuest)!
        const message = await a.parent.post('/api/messages', { data: { toMemberId: guest.id, fileId: await uploadAudio(a.parent), mime: 'audio/wav', durationMs: 300 } })
        expect(message.status()).toBe(400)
        for (const api of [b.parent, tata, c.parent]) {
            expect((await api.get(`/api/files/${fileId}`)).status()).toBe(404)
            expect((await api.get(`/api/books/${book.id}`)).status()).toBe(404)
            expect(((await (await api.get('/api/books')).json()) as IBookSummary[]).some(item => item.id === book.id)).toBe(false)
        }
        expect((await tata.put(`/api/books/${book.id}/lines/${book.lineIds[0]}/audio`, { data: { fileId: await uploadAudio(tata) } })).status()).toBe(404)
    })

    test('a relative never sees the library, only the requests addressed to them', async () => {
        expect(((await (await tata.get('/api/books')).json()) as IBookSummary[])).toHaveLength(0)
        expect((await lists(tata)).incoming).toHaveLength(1)
        expect((await lists(cousin)).incoming).toHaveLength(0)
        expect((await notifications(tata)).items).toHaveLength(0)
        expect((await tata.post('/api/shares', { data: { bookId: book.id, code: codeC, mode: 'copy' } })).status()).toBe(404)
    })

    test('another voice cannot overwrite a recorded line and a second family can take the others', async () => {
        const [, second, third] = book.lineIds
        const share = (await (await shareBook(a.parent, { bookId: book.id, code: codeC, mode: 'record', lineIds: [second, third] })).json()) as IShareResult
        expect((await c.parent.post(`/api/shares/${share.id}/accept`, {})).status()).toBe(200)
        expect((await c.parent.put(`/api/shares/${share.id}/lines/${second}/audio`, { data: { fileId: await uploadAudio(c.parent), language: 'fr' } })).status()).toBe(409)
        expect((await c.parent.put(`/api/shares/${share.id}/lines/${third}/audio`, { data: { fileId: await uploadAudio(c.parent), language: 'fr' } })).status()).toBe(200)
        const members = (await (await a.parent.get('/api/members')).json()) as IMember[]
        expect(members.filter(member => member.isGuest)).toHaveLength(2)
    })

    test('stopping a share ends the access it granted', async () => {
        const [first] = book.lineIds
        expect((await a.parent.delete(`/api/shares/${recordShareId}`)).status()).toBe(200)
        expect((await a.parent.delete(`/api/shares/${recordShareId}`)).status()).toBe(404)
        expect((await tata.get(`/api/shares/${recordShareId}/book`)).status()).toBe(404)
        expect((await tata.put(`/api/shares/${recordShareId}/lines/${first}/audio`, { data: { fileId: await uploadAudio(tata), language: 'fr' } })).status()).toBe(404)
        expect((await lists(b.parent)).incoming[0]).toMatchObject({ status: 'revoked' })
    })

    test('copy mode gives the other family an independent text only copy', async () => {
        const created = (await (await shareBook(a.parent, { bookId: book.id, code: codeC, mode: 'copy' })).json()) as IShareResult
        expect((await shareBook(a.parent, { bookId: book.id, code: codeC, mode: 'copy' })).status()).toBe(409)
        const accepted = (await (await c.parent.post(`/api/shares/${created.id}/accept`, {})).json()) as { copiedBookId: string }
        copiedBookId = accepted.copiedBookId
        const copy = (await (await c.parent.get(`/api/books/${copiedBookId}`)).json()) as IBook
        expect(copy).toMatchObject({ title: 'Livre partagé', status: 'to_record' })
        expect(copy.lines.map(line => line.text)).toEqual(['Un', 'Deux', 'Trois'])
        expect(copy.lines.every(line => line.memberId === null && line.audioFileId === null)).toBe(true)
        expect(copy.recordings).toHaveLength(0)
        const renamed = await c.parent.patch(`/api/books/${copiedBookId}`, { data: { title: 'Autre titre' } })
        expect(renamed.ok()).toBeTruthy()
        expect(((await (await a.parent.get(`/api/books/${book.id}`)).json()) as IBook).title).toBe('Livre partagé')
        expect((await notifications(a.parent)).items.some(item => item.kind === 'share_accepted')).toBe(true)
    })

    test('a declined share can be sent again', async () => {
        const created = (await (await shareBook(a.parent, { bookId: book.id, code: codeB, mode: 'copy' })).json()) as IShareResult
        expect((await tata.post(`/api/shares/${created.id}/decline`)).status()).toBe(403)
        expect((await b.parent.post(`/api/shares/${created.id}/decline`)).status()).toBe(200)
        expect((await notifications(a.parent)).items.some(item => item.kind === 'share_declined')).toBe(true)
        expect((await shareBook(a.parent, { bookId: book.id, code: codeB, mode: 'copy' })).status()).toBe(200)
    })

    test('sharing a received copy again needs the consent of the book owner', async () => {
        const created = (await (await shareBook(c.parent, { bookId: copiedBookId, code: codeB, mode: 'copy' })).json()) as IShareResult
        expect(created.status).toBe('awaiting_owner')
        const pendingForB = (await lists(b.parent)).incoming.filter(share => share.id === created.id)
        expect(pendingForB).toHaveLength(0)
        expect((await a.parent.get('/api/shares').then(response => response.json()) as IShareLists).approvals.map(share => share.id)).toContain(created.id)
        expect((await c.parent.post(`/api/shares/${created.id}/approve`)).status()).toBe(404)
        expect((await b.parent.post(`/api/shares/${created.id}/accept`, {})).status()).toBe(404)
        const approved = await a.parent.post(`/api/shares/${created.id}/approve`)
        expect(approved.status()).toBe(200)
        expect(((await approved.json()) as IShareResult).status).toBe('pending')
        expect((await lists(b.parent)).incoming.map(share => share.id)).toContain(created.id)
    })

    test('a relative proposes a single voice book that a parent approves before it is sent', async () => {
        const created = await mamie.post('/api/books', {
            data: { title: 'Histoire de Mamie', kind: 'solo', soloMemberId: mamieId, imageDesc: '', pageFileIds: [], lines: [{ pageIndex: 0, character: 'Mamie', text: 'Il était une fois' }] },
        })
        const { id } = (await created.json()) as { id: string }
        expect((await shareBook(mamie, { bookId: book.id, code: codeB, mode: 'copy' })).status()).toBe(403)
        const proposal = (await (await shareBook(mamie, { bookId: id, code: codeB, mode: 'copy' })).json()) as IShareResult
        expect(proposal.status).toBe('proposed')
        expect((await lists(b.parent)).incoming.map(share => share.id)).not.toContain(proposal.id)
        expect((await lists(a.parent)).approvals.map(share => share.id)).toContain(proposal.id)
        expect((await lists(mamie)).outgoing.map(share => share.id)).toContain(proposal.id)
        expect((await mamie.post(`/api/shares/${proposal.id}/approve`)).status()).toBe(403)
        expect((await a.parent.post(`/api/shares/${proposal.id}/approve`)).status()).toBe(200)
        expect((await lists(b.parent)).incoming.map(share => share.id)).toContain(proposal.id)
        expect((await notifications(mamie)).items.some(item => item.kind === 'share_approved')).toBe(true)
        expect((await notifications(a.parent)).items.some(item => item.kind === 'share_approved')).toBe(false)
    })

    test('recordings by a relative are grouped in one notification per book until it is read', async () => {
        const mine = await createBookApi(a.parent, 'Livre de Mamie', ['Un', 'Deux', 'Trois'])
        await a.parent.patch(`/api/books/${mine.id}`, { data: { lines: mine.lineIds.map(id => ({ id, memberId: mamieId })) } })
        for (const lineId of mine.lineIds.slice(0, 2)) {
            expect((await mamie.put(`/api/books/${mine.id}/lines/${lineId}/audio`, { data: { fileId: await uploadAudio(mamie), ms: 300 } })).status()).toBe(200)
        }
        expect((await mamie.post(`/api/books/${mine.id}/submit`, { data: {} })).status()).toBe(200)
        const find = async (): Promise<INotification[]> => (await notifications(a.parent)).items.filter(item => item.kind === 'recording_batch' && item.payload.bookId === mine.id)
        const [batch] = await find()
        expect(batch).toMatchObject({ count: 2, isRead: false })
        expect(batch!.payload).toMatchObject({ memberName: 'Mamie', bookTitle: 'Livre de Mamie' })
        const before = (await notifications(a.parent)).unreadCount
        expect((await a.parent.post('/api/notifications/read', { data: { ids: [batch!.id] } })).status()).toBe(200)
        expect((await notifications(a.parent)).unreadCount).toBe(before - 1)
        await mamie.put(`/api/books/${mine.id}/lines/${mine.lineIds[2]}/audio`, { data: { fileId: await uploadAudio(mamie), ms: 300 } })
        await mamie.post(`/api/books/${mine.id}/submit`, { data: {} })
        const next = await find()
        expect(next).toHaveLength(2)
        expect(next[0]).toMatchObject({ count: 1, isRead: false })
        await a.parent.post('/api/notifications/read', { data: {} })
        expect((await notifications(a.parent)).unreadCount).toBe(0)
        expect((await notifications(b.parent)).items.some(item => item.kind === 'recording_batch')).toBe(false)
    })

    test('invalid sharing requests are refused', async () => {
        const [first] = book.lineIds
        const child = await addMemberApi(a.parent, 'Lova', 'child')
        expect(child).toBeTruthy()
        expect((await shareBook(a.parent, { bookId: book.id, code: 'zzzzzzzzzz', mode: 'copy' })).status()).toBe(404)
        expect((await shareBook(a.parent, { bookId: book.id, code: await inviteCode(a.parent), mode: 'copy' })).status()).toBe(400)
        expect((await shareBook(a.parent, { bookId: book.id, code: codeB, mode: 'other' })).status()).toBe(400)
        expect((await shareBook(a.parent, { bookId: book.id, code: codeC, mode: 'record', lineIds: [] })).status()).toBe(400)
        expect((await shareBook(a.parent, { bookId: book.id, code: codeC, mode: 'record', lineIds: ['not-a-line'] })).status()).toBe(400)
        expect((await shareBook(b.parent, { bookId: book.id, code: codeC, mode: 'copy' })).status()).toBe(404)
        expect((await shareBook(b.parent, { bookId: first, code: codeC, mode: 'copy' })).status()).toBe(404)
    })

    test('children cannot use sharing at all', async ({ playwright, baseURL }) => {
        const lova = await profileApi(playwright, baseURL, a.account, 'Lova')
        expect((await lova.get('/api/shares')).status()).toBe(403)
        expect((await lova.get('/api/notifications')).status()).toBe(403)
        expect((await lova.get('/api/family/invite')).status()).toBe(403)
        expect((await shareBook(lova, { bookId: book.id, code: codeB, mode: 'copy' })).status()).toBe(403)
        expect((await lova.post(`/api/shares/${recordShareId}/approve`)).status()).toBe(403)
        await lova.dispose()
    })

    test('a book is shared with at most ten families', async ({ playwright, baseURL }) => {
        const owner = await openFamily(playwright, baseURL, 'share-max')
        const popular = await createBookApi(owner.parent, 'Très partagé', ['Un'])
        const targets: IFamilyApi[] = []
        for (let index = 0; index <= MAX_FAMILIES_PER_BOOK; index++) {
            targets.push(await openFamily(playwright, baseURL, `share-max-${index}`))
        }
        const shares: string[] = []
        for (const target of targets.slice(0, MAX_FAMILIES_PER_BOOK)) {
            const response = await shareBook(owner.parent, { bookId: popular.id, code: await inviteCode(target.parent), mode: 'copy' })
            expect(response.status(), await response.text()).toBe(200)
            shares.push(((await response.json()) as IShareResult).id)
        }
        const last = targets[MAX_FAMILIES_PER_BOOK]!
        const lastCode = await inviteCode(last.parent)
        expect((await shareBook(owner.parent, { bookId: popular.id, code: lastCode, mode: 'copy' })).status()).toBe(409)
        expect((await owner.parent.delete(`/api/shares/${shares[0]}`)).status()).toBe(200)
        expect((await shareBook(owner.parent, { bookId: popular.id, code: lastCode, mode: 'copy' })).status()).toBe(200)
        await Promise.all([owner, ...targets].map(family => family.parent.dispose()))
    })
})
