import { expect, test } from '@playwright/test'
import type { APIRequestContext, Locator, Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'

export const RUN_ID = process.env.E2E_RUN_ID ?? String(Date.now())
export const E2E_PASSWORD = 'e2e-password-123'
export const PARENT_NAME = 'Parent'

export interface IE2eAccount {
    email: string
    password: string
    familyName: string
}

export const accountFor = (label: string): IE2eAccount => ({
    email: `e2e-${RUN_ID}-${label}@tantara.test`,
    password: E2E_PASSWORD,
    familyName: `Famille ${label}`,
})

export const uniqueAccount = (label: string): IE2eAccount => accountFor(`${label}-${randomUUID().slice(0, 8)}`)

export const signIn = async (api: APIRequestContext, account: IE2eAccount): Promise<void> => {
    const registered = await api.post('/api/auth/register', {
        data: { email: account.email, password: account.password, familyName: account.familyName, parentName: PARENT_NAME },
    })
    if (registered.status() === 409) {
        const response = await api.post('/api/auth/login', { data: { email: account.email, password: account.password } })
        expect(response.ok()).toBeTruthy()
        return
    }
    expect(registered.ok()).toBeTruthy()
}

export const login = async (page: Page): Promise<void> => {
    await signIn(page.request, accountFor(test.info().project.name))
    await page.goto('/profiles')
    await expect(page).toHaveURL(/\/profiles/)
}

export const useProfile = async (api: APIRequestContext, name: string): Promise<string> => {
    const members = (await (await api.get('/api/members')).json()) as IApiMember[]
    const member = members.find(item => item.name === name)
    expect(member).toBeTruthy()
    const response = await api.post('/api/auth/profile', { data: { memberId: member!.id } })
    expect(response.ok()).toBeTruthy()
    return member!.id
}

const PNG_PIXEL = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64',
)

export const pngFile = (name: string): { name: string; mimeType: string; buffer: Buffer } => ({
    name,
    mimeType: 'image/png',
    buffer: PNG_PIXEL,
})

export const chooseProfile = async (page: Page, name: string): Promise<void> => {
    await page.goto('/profiles')
    await page.locator('button.card', { hasText: name }).first().click()
    await expect(page).not.toHaveURL(/\/profiles/)
}

export const switchProfile = async (page: Page, name: string): Promise<void> => {
    await page.getByRole('button', { name: 'Changer de profil' }).click()
    await page.locator('.sheet button.card', { hasText: name }).first().click()
    await expect(page.locator('.sheet')).toHaveCount(0)
}

export const addMember = async (page: Page, name: string, role: 'Parent' | 'Proche' | 'Enfant'): Promise<void> => {
    await page.goto('/family/add')
    await page.getByPlaceholder('Maman, Mamie, Lova…').fill(name)
    await page.getByRole('button', { name: role, exact: true }).click()
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page).toHaveURL(/\/family$/)
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
}

export const recordOnce = async (page: Page, _unused?: Locator, ms = 1300): Promise<void> => {
    await page.getByRole('button', { name: 'Enregistrer' }).click()
    await expect(page.getByRole('button', { name: 'Arrêter' })).toBeVisible()
    await page.waitForTimeout(ms)
    await page.getByRole('button', { name: 'Arrêter' }).click()
}

export const apiJson = async <T>(page: Page, path: string): Promise<T> => {
    const response = await page.request.get(`/api${path}`)
    expect(response.ok()).toBeTruthy()
    return (await response.json()) as T
}

export const addLine = async (page: Page, pageNumber: number, character: string | null, text: string): Promise<void> => {
    const card = page.locator('.card', { has: page.getByText(`Page ${pageNumber}`, { exact: true }) })
    if ((await card.locator('textarea.input').count()) === 0) {
        await card.getByRole('button', { name: 'Ajouter une réplique' }).click()
    }
    if (character !== null) {
        await card.getByPlaceholder('Qui parle ? (Narrateur, Petit Zébu…)').fill(character)
    }
    await card.locator('textarea.input').fill(text)
    await card.getByRole('button', { name: 'Ajouter', exact: true }).click()
    await expect(card.getByText(text, { exact: true })).toBeVisible()
}

export const uniqueName = (base: string, projectName: string): string => `${base}-${projectName}`

export const fakeAudioBytes = (): Buffer => Buffer.from('GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAHTEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBVJqWZTrIHfTbuMU6uEFlSua1OsggEwTbuMU6uEHFO7a1OsggHk', 'base64')

export const makeWav = (ms: number): Buffer => {
    const rate = 8000
    const samples = Math.round((rate * ms) / 1000)
    const data = Buffer.alloc(samples * 2)
    for (let i = 0; i < samples; i++) {
        data.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 8000), i * 2)
    }
    const header = Buffer.alloc(44)
    header.write('RIFF', 0)
    header.writeUInt32LE(36 + data.length, 4)
    header.write('WAVEfmt ', 8)
    header.writeUInt32LE(16, 16)
    header.writeUInt16LE(1, 20)
    header.writeUInt16LE(1, 22)
    header.writeUInt32LE(rate, 24)
    header.writeUInt32LE(rate * 2, 28)
    header.writeUInt16LE(2, 32)
    header.writeUInt16LE(16, 34)
    header.write('data', 36)
    header.writeUInt32LE(data.length, 40)
    return Buffer.concat([header, data])
}

export interface IApiMember {
    id: string
    name: string
    role: string
}

export interface IReadyLine {
    pageIndex: number
    character: string
    text: string
    memberName: string
}

export const uploadWav = async (page: Page, ms = 700): Promise<string> => {
    const response = await page.request.post('/api/files', { data: makeWav(ms), headers: { 'content-type': 'audio/wav' } })
    expect(response.ok()).toBeTruthy()
    return ((await response.json()) as { id: string }).id
}

export const createReadyBook = async (
    page: Page,
    title: string,
    kind: 'multi' | 'solo',
    lines: IReadyLine[],
): Promise<string> => {
    const members = await apiJson<IApiMember[]>(page, '/members')
    const find = (name: string): string => members.find(member => member.name === name)!.id
    const soloMemberId = kind === 'solo' ? find(lines[0]!.memberName) : null
    const created = await page.request.post('/api/books', {
        data: {
            title,
            kind,
            soloMemberId,
            imageDesc: '',
            pageFileIds: [],
            lines: lines.map(line => ({ pageIndex: line.pageIndex, character: line.character, text: line.text })),
        },
    })
    const { id } = (await created.json()) as { id: string }
    const book = await apiJson<{ lines: { id: string }[] }>(page, `/books/${id}`)
    await page.request.patch(`/api/books/${id}`, {
        data: { lines: book.lines.map((line, index) => ({ id: line.id, memberId: find(lines[index]!.memberName) })) },
    })
    for (const line of book.lines) {
        const fileId = await uploadWav(page)
        const response = await page.request.put(`/api/books/${id}/lines/${line.id}/audio`, { data: { fileId, ms: 700 } })
        expect(response.ok()).toBeTruthy()
    }
    await page.request.patch(`/api/books/${id}`, { data: { status: 'ready' } })
    return id
}
