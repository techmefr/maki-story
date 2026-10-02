import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import postgres from 'postgres'
import { computeAge, daysUntilBirthday, isBirthdayToday, isValidBirthDate } from '../../shared/utils/age'
import { scrubValue } from '../../server/utils/journal'
import { PROFILE_PIN, signIn, uniqueAccount, useProfile } from './helpers'
import type { IE2eAccount } from './helpers'

const DATABASE_URL = process.env.E2E_DATABASE_URL ?? 'postgresql://tantara@localhost:5544/tantara_e2e'

test.describe('age helpers', () => {
    test('the age changes exactly on the birthday in the child timezone', () => {
        const before = new Date('2026-03-09T23:30:00Z')
        expect(computeAge('2020-03-10', 'UTC', before)).toBe(5)
        expect(computeAge('2020-03-10', 'Pacific/Auckland', before)).toBe(6)
        expect(computeAge('2020-03-10', 'America/Los_Angeles', new Date('2026-03-10T05:00:00Z'))).toBe(5)
        expect(computeAge('2020-03-10', 'UTC', new Date('2026-03-10T00:00:00Z'))).toBe(6)
    })

    test('the party is only for a real birthday in the child timezone', () => {
        expect(isBirthdayToday('2020-03-10', 'UTC', new Date('2026-03-10T12:00:00Z'))).toBe(true)
        expect(isBirthdayToday('2020-03-10', 'UTC', new Date('2026-03-11T12:00:00Z'))).toBe(false)
        expect(isBirthdayToday('2026-03-10', 'UTC', new Date('2026-03-10T12:00:00Z'))).toBe(false)
        expect(isBirthdayToday('2020-03-10', 'Pacific/Auckland', new Date('2026-03-09T23:30:00Z'))).toBe(true)
    })

    test('a leap day birthday is celebrated on the 28th of a common year', () => {
        expect(isBirthdayToday('2020-02-29', 'UTC', new Date('2027-02-28T10:00:00Z'))).toBe(true)
        expect(computeAge('2020-02-29', 'UTC', new Date('2027-02-27T10:00:00Z'))).toBe(6)
        expect(computeAge('2020-02-29', 'UTC', new Date('2027-02-28T10:00:00Z'))).toBe(7)
        expect(isBirthdayToday('2020-02-29', 'UTC', new Date('2028-02-29T10:00:00Z'))).toBe(true)
    })

    test('the countdown to the next birthday drives the reminders', () => {
        expect(daysUntilBirthday('2020-03-10', 'UTC', new Date('2026-03-07T12:00:00Z'))).toBe(3)
        expect(daysUntilBirthday('2020-03-10', 'UTC', new Date('2026-03-10T12:00:00Z'))).toBe(0)
        expect(daysUntilBirthday('2020-03-10', 'UTC', new Date('2026-03-11T12:00:00Z'))).toBe(364)
    })

    test('a birth date must be a real past date', () => {
        const now = new Date('2026-03-10T12:00:00Z')
        expect(isValidBirthDate('2020-03-10', now)).toBe(true)
        expect(isValidBirthDate('2020-02-30', now)).toBe(false)
        expect(isValidBirthDate('2027-01-01', now)).toBe(false)
        expect(isValidBirthDate('10/03/2020', now)).toBe(false)
        expect(isValidBirthDate(20200310, now)).toBe(false)
    })
})

test.describe('journal scrubbing', () => {
    test('secrets, personal data and long tokens never reach the journal', () => {
        const scrubbed = scrubValue({
            role: 'child',
            code: '123456',
            pinHash: 'abc',
            birthDate: '2020-03-10',
            note: 'contact me at someone@example.com',
            opaque: 'a'.repeat(40),
            nested: { token: 'x', name: 'Lova', deep: { more: { tooDeep: 1 } } },
        }) as Record<string, unknown>
        expect(scrubbed.role).toBe('child')
        expect(scrubbed.code).toBe('[redacted]')
        expect(scrubbed.pinHash).toBe('[redacted]')
        expect(scrubbed.birthDate).toBe('[redacted]')
        expect(scrubbed.note).toBe('contact me at [redacted]')
        expect(scrubbed.opaque).toBe('[redacted]')
        expect((scrubbed.nested as Record<string, unknown>).token).toBe('[redacted]')
        expect((scrubbed.nested as Record<string, unknown>).name).toBe('Lova')
    })
})

test.describe('child birth date api', () => {
    let account: IE2eAccount
    let parent: APIRequestContext
    let mamie: APIRequestContext
    let childId = ''

    test.beforeAll(async ({ playwright, baseURL }) => {
        account = uniqueAccount('birth')
        parent = await playwright.request.newContext({ baseURL })
        await signIn(parent, account)
        await useProfile(parent, 'Parent')
        const relative = await parent.post('/api/members', { data: { name: 'Mamie', role: 'relative', color: 'coral', code: { kind: 'pin', value: PROFILE_PIN } } })
        expect(relative.ok()).toBeTruthy()
        const child = await parent.post('/api/members', {
            data: { name: 'Lova', role: 'child', color: 'sky', code: { kind: 'pin', value: PROFILE_PIN }, birthDate: '2020-03-10' },
        })
        expect(child.ok(), await child.text()).toBeTruthy()
        childId = ((await child.json()) as { id: string }).id
        mamie = await playwright.request.newContext({ baseURL })
        await signIn(mamie, account)
        await useProfile(mamie, 'Mamie')
    })

    test.afterAll(async () => {
        await Promise.all([parent.dispose(), mamie.dispose()])
    })

    test('only a parent writes the birth date and invalid values are refused', async () => {
        expect((await mamie.patch(`/api/members/${childId}`, { data: { birthDate: '2019-01-01' } })).status()).toBe(403)
        expect((await parent.patch(`/api/members/${childId}`, { data: { birthDate: '2999-01-01' } })).status()).toBe(400)
        expect((await parent.patch(`/api/members/${childId}`, { data: { birthDate: 'nope' } })).status()).toBe(400)
        const members = (await (await parent.get('/api/members')).json()) as { id: string; role: string }[]
        const relative = members.find(member => member.role === 'relative')!
        expect((await parent.patch(`/api/members/${relative.id}`, { data: { birthDate: '1950-01-01' } })).status()).toBe(400)
        const updated = await parent.patch(`/api/members/${childId}`, { data: { birthDate: '2019-05-06' } })
        expect(updated.status()).toBe(200)
        expect(((await updated.json()) as { birthDate: string }).birthDate).toBe('2019-05-06')
        const cleared = await parent.patch(`/api/members/${childId}`, { data: { birthDate: null } })
        expect(((await cleared.json()) as { birthDate: string | null }).birthDate).toBeNull()
        await parent.patch(`/api/members/${childId}`, { data: { birthDate: '2020-03-10' } })
    })

    test('a relative gets the computed age but never the birth date', async () => {
        const asParent = (await (await parent.get('/api/members')).json()) as { id: string; birthDate: string | null; ageYears: number | null }[]
        const asRelative = (await (await mamie.get('/api/members')).json()) as { id: string; birthDate: string | null; ageYears: number | null }[]
        expect(asParent.find(member => member.id === childId)!.birthDate).toBe('2020-03-10')
        const seen = asRelative.find(member => member.id === childId)!
        expect(seen.birthDate).toBeNull()
        expect(seen.ageYears).toBeGreaterThanOrEqual(5)
    })

    test('the journal records the change without the birth date value', async () => {
        const db = postgres(DATABASE_URL, { max: 1, onnotice: () => undefined })
        try {
            const rows = await db`select action, after::text as after from audit_log where entity_id = ${childId} and action = 'member.updated'`
            expect(rows.length).toBeGreaterThan(0)
            for (const row of rows) {
                expect(String(row.after)).not.toContain('2020-03-10')
                expect(String(row.after)).not.toContain('2019-05-06')
            }
        } finally {
            await db.end()
        }
    })
})

test.describe('symbol codes, disabled child code, birthday and book metadata', () => {
    let account: IE2eAccount
    let parent: APIRequestContext

    test.beforeAll(async ({ playwright, baseURL }) => {
        account = uniqueAccount('sym')
        parent = await playwright.request.newContext({ baseURL })
        await signIn(parent, account)
        await useProfile(parent, 'Parent')
    })

    test.afterAll(async () => {
        await parent.dispose()
    })

    test('a symbol code is 4 symbols of 6, repeats allowed, children only', async () => {
        const child = await parent.post('/api/members', { data: { name: 'Lova', role: 'child', color: 'sky', code: { kind: 'symbols', value: '0000' } } })
        expect(child.ok(), await child.text()).toBeTruthy()
        const childId = ((await child.json()) as { id: string }).id
        for (const value of ['012', '01234', '0126', 'abcd']) {
            expect((await parent.put(`/api/members/${childId}/code`, { data: { kind: 'symbols', value } })).status()).toBe(400)
        }
        expect((await parent.put(`/api/members/${childId}/code`, { data: { kind: 'symbols', value: '5120' } })).ok()).toBeTruthy()
        const adult = await parent.post('/api/members', { data: { name: 'Tonton', role: 'relative', color: 'coral', code: { kind: 'symbols', value: '0123' } } })
        expect(adult.status()).toBe(400)
        const short = await parent.post('/api/members', { data: { name: 'Tati', role: 'relative', color: 'coral', code: { kind: 'pin', value: '1234' } } })
        expect(short.status()).toBe(400)
    })

    test('a child with the code disabled enters without one', async ({ playwright, baseURL }) => {
        const child = await parent.post('/api/members', { data: { name: 'Nono', role: 'child', color: 'mint', codeEnabled: false } })
        expect(child.ok(), await child.text()).toBeTruthy()
        const childId = ((await child.json()) as { id: string }).id
        const other = await playwright.request.newContext({ baseURL })
        try {
            await signIn(other, account)
            expect((await other.post('/api/auth/profile', { data: { memberId: childId } })).ok()).toBeTruthy()
        } finally {
            await other.dispose()
        }
        const off = await parent.patch(`/api/members/${childId}`, { data: { codeEnabled: true } })
        expect(((await off.json()) as { codeEnabled: boolean }).codeEnabled).toBe(true)
    })

    test('the birthday party is recorded once per year', async () => {
        const child = await parent.post('/api/members', { data: { name: 'Fete', role: 'child', color: 'pink', birthDate: '2020-03-10', codeEnabled: false } })
        const childId = ((await child.json()) as { id: string }).id
        const year = new Date().getUTCFullYear()
        expect((await parent.post(`/api/members/${childId}/birthday-celebrated`, { data: { year } })).ok()).toBeTruthy()
        expect((await parent.post(`/api/members/${childId}/birthday-celebrated`, { data: { year: 1900 } })).status()).toBe(400)
        const members = (await (await parent.get('/api/members')).json()) as { id: string; birthdayCelebratedYear: number | null; birthdayInDays: number | null }[]
        const seen = members.find(member => member.id === childId)!
        expect(seen.birthdayCelebratedYear).toBe(year)
        expect(seen.birthdayInDays).toBeGreaterThanOrEqual(0)
    })

    test('a book carries its voice languages, moods and themes', async () => {
        const base = { title: 'Meta', kind: 'multi', imageDesc: '', pageFileIds: [], lines: [{ pageIndex: 0, character: 'Narrateur', text: 'Salut' }] }
        const created = await parent.post('/api/books', { data: { ...base, writtenLanguage: 'fr', voiceLanguages: ['fr', 'en'], moods: ['calm'], themes: ['animals', 'nature'] } })
        expect(created.ok(), await created.text()).toBeTruthy()
        const { id } = (await created.json()) as { id: string }
        const book = (await (await parent.get(`/api/books/${id}`)).json()) as { id: string; writtenLanguage: string; voiceLanguages: string[]; moods: string[]; themes: string[] }
        expect(book).toMatchObject({ writtenLanguage: 'fr', voiceLanguages: ['fr', 'en'], moods: ['calm'], themes: ['animals', 'nature'] })
        expect((await parent.post('/api/books', { data: { ...base, moods: ['nope'] } })).status()).toBe(400)
        expect((await parent.post('/api/books', { data: { ...base, voiceLanguages: ['not a language'] } })).status()).toBe(400)
        const patched = await parent.patch(`/api/books/${book.id}`, { data: { themes: ['school'] } })
        expect(patched.ok()).toBeTruthy()
        expect(((await (await parent.get(`/api/books/${id}`)).json()) as { themes: string[] }).themes).toEqual(['school'])
    })
})
