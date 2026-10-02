import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { UPLOAD_OFFSET_HEADER } from '../../shared/utils/upload'
import { addMemberApi, createBookApi, inviteCode, openFamily, profileApi, uploadAudio } from './family-helpers'
import type { IFamilyApi } from './family-helpers'

const REFUSED = 'Cross-site request refused'

test.describe('security hardening', () => {
    let family: IFamilyApi
    let other: IFamilyApi
    let tonton: APIRequestContext
    let lova: APIRequestContext
    let ids = { tonton: '', lova: '' }

    test.beforeAll(async ({ playwright, baseURL }) => {
        family = await openFamily(playwright, baseURL, 'security')
        other = await openFamily(playwright, baseURL, 'security-other')
        ids = { tonton: await addMemberApi(family.parent, 'Tonton', 'relative'), lova: await addMemberApi(family.parent, 'Lova', 'child') }
        tonton = await profileApi(playwright, baseURL, family.account, 'Tonton')
        lova = await profileApi(playwright, baseURL, family.account, 'Lova')
    })

    test.afterAll(async () => {
        await Promise.all([family.parent, other.parent, tonton, lova].map(api => api.dispose()))
    })

    test('state changing requests from another origin are refused', async ({ baseURL }) => {
        const data = { ids: [] }
        const foreign = await family.parent.post('/api/notifications/read', { data, headers: { origin: 'https://evil.example' } })
        expect(foreign.status()).toBe(403)
        expect(await foreign.text()).toContain(REFUSED)
        const crossSite = await family.parent.post('/api/notifications/read', { data, headers: { 'sec-fetch-site': 'cross-site' } })
        expect(crossSite.status()).toBe(403)
        const sameSite = await family.parent.post('/api/notifications/read', { data, headers: { 'sec-fetch-site': 'same-site' } })
        expect(sameSite.status()).toBe(403)
        const nullOrigin = await family.parent.post('/api/notifications/read', { data, headers: { origin: 'null' } })
        expect(nullOrigin.status()).toBe(403)
        const deleteForeign = await family.parent.delete(`/api/members/${ids.tonton}`, { headers: { origin: 'https://evil.example' } })
        expect(deleteForeign.status()).toBe(403)
        const members = (await (await family.parent.get('/api/members')).json()) as { id: string }[]
        expect(members.map(member => member.id)).toContain(ids.tonton)
        const sameOrigin = await family.parent.post('/api/notifications/read', { data, headers: { origin: baseURL!, 'sec-fetch-site': 'same-origin' } })
        expect(sameOrigin.status()).toBe(200)
        const noHeaders = await family.parent.post('/api/notifications/read', { data })
        expect(noHeaders.status()).toBe(200)
    })

    test('the login and register routes are protected too', async ({ playwright, baseURL }) => {
        const anonymous = await playwright.request.newContext({ baseURL })
        const login = await anonymous.post('/api/auth/login', { data: { email: 'x@x.test', password: 'whatever12' }, headers: { origin: 'https://evil.example' } })
        expect(login.status()).toBe(403)
        const register = await anonymous.post('/api/auth/register', {
            data: { email: 'csrf@tantara.test', password: 'password-123', familyName: 'F', parentName: 'P' },
            headers: { 'sec-fetch-site': 'cross-site' },
        })
        expect(register.status()).toBe(403)
        await anonymous.dispose()
    })

    test('safe reads and the identity provider callback are not blocked', async ({ playwright, baseURL }) => {
        const read = await family.parent.get('/api/members', { headers: { origin: 'https://evil.example', 'sec-fetch-site': 'cross-site' } })
        expect(read.status()).toBe(200)
        const anonymous = await playwright.request.newContext({ baseURL })
        const callback = await anonymous.post('/api/auth/oauth/apple/callback', { form: { code: 'x', state: 'y' }, headers: { 'sec-fetch-site': 'cross-site' }, maxRedirects: 0 })
        expect(await callback.text()).not.toContain(REFUSED)
        await anonymous.dispose()
    })

    test('an upload session belongs to the profile that started it', async () => {
        const started = await tonton.post('/api/uploads', { data: { size: 4, mime: 'audio/wav' } })
        expect(started.status()).toBe(200)
        const { id } = (await started.json()) as { id: string }
        const chunk = Buffer.from('abcd')
        for (const api of [family.parent, lova, other.parent]) {
            expect((await api.get(`/api/uploads/${id}`)).status()).toBe(404)
            expect((await api.patch(`/api/uploads/${id}`, { data: chunk, headers: { [UPLOAD_OFFSET_HEADER]: '0', 'content-type': 'application/octet-stream' } })).status()).toBe(404)
            expect((await api.post(`/api/uploads/${id}/finish`)).status()).toBe(404)
            expect((await api.delete(`/api/uploads/${id}`)).status()).toBe(404)
        }
        const patch = await tonton.patch(`/api/uploads/${id}`, { data: chunk, headers: { [UPLOAD_OFFSET_HEADER]: '0', 'content-type': 'application/octet-stream' } })
        expect(patch.status()).toBe(200)
        expect((await lova.post(`/api/uploads/${id}/finish`)).status()).toBe(404)
        expect((await tonton.post(`/api/uploads/${id}/finish`)).status()).toBe(200)
    })

    test('a child or a relative cannot delete a parent', async () => {
        const parentId = ((await (await family.parent.get('/api/auth/me')).json()) as { memberId: string }).memberId
        expect((await lova.delete(`/api/members/${parentId}`)).status()).toBe(403)
        expect((await tonton.delete(`/api/members/${parentId}`)).status()).toBe(403)
        expect((await lova.delete('/api/feedback/anything')).status()).toBe(403)
    })

    test('device and code routes follow the permission map', async () => {
        const parentId = ((await (await family.parent.get('/api/auth/me')).json()) as { memberId: string }).memberId
        expect((await lova.put(`/api/members/${parentId}/code`, { data: { kind: 'pin', value: '999999' } })).status()).toBe(403)
        expect((await tonton.put(`/api/members/${parentId}/code`, { data: { kind: 'pin', value: '999999' } })).status()).toBe(403)
        expect((await tonton.put(`/api/members/${ids.lova}/code`, { data: { kind: 'pin', value: '999999' } })).status()).toBe(403)
        const enrolled = await tonton.post('/api/devices', { data: { label: 'Téléphone' } })
        expect(enrolled.status()).toBe(200)
        const { id } = (await enrolled.json()) as { id: string }
        expect((await lova.get('/api/devices')).status()).toBe(200)
        expect(((await (await lova.get('/api/devices')).json()) as { id: string }[]).map(device => device.id)).not.toContain(id)
        expect((await lova.delete(`/api/devices/${id}`)).status()).toBe(404)
        expect((await other.parent.delete(`/api/devices/${id}`)).status()).toBe(404)
        expect(((await (await family.parent.get('/api/devices')).json()) as { id: string }[]).map(device => device.id)).toContain(id)
        expect((await tonton.delete(`/api/devices/${id}`)).status()).toBe(200)
    })

    test('a file of another family is never readable', async () => {
        const fileId = await uploadAudio(family.parent)
        const book = await createBookApi(family.parent, 'Privé', ['Un'])
        expect(book.id).toBeTruthy()
        expect((await other.parent.get(`/api/files/${fileId}`)).status()).toBe(404)
        expect((await other.parent.get(`/api/books/${book.id}`)).status()).toBe(404)
    })

    test('guessing invite codes is throttled per address', async () => {
        const target = await createBookApi(other.parent, 'Pour le code', ['Un'])
        const real = await inviteCode(family.parent)
        const address = `198.51.100.${Math.floor(Math.random() * 250) + 1}`
        const attempt = (code: string) =>
            other.parent.post('/api/shares', { data: { bookId: target.id, code, mode: 'copy' }, headers: { 'x-forwarded-for': address } })
        let refused = 0
        for (let index = 0; index < 30; index++) {
            const response = await attempt(`wrong${String(index).padStart(5, '0')}`)
            if (response.status() === 429) {
                refused += 1
            } else {
                expect(response.status()).toBe(404)
            }
        }
        expect(refused).toBeGreaterThan(0)
        expect((await attempt(real)).status()).toBe(429)
    })
})
