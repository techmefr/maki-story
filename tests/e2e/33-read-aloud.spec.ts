import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { randomUUID } from 'node:crypto'
import type { IBook } from '../../shared/types/book'
import { apiJson, chooseProfile, login, PARENT_NAME, PROFILE_PIN, useProfile } from './helpers'

interface IVoiceMock {
    voices: { lang: string; name: string }[]
}

const SPEECH_MOCK = (config: IVoiceMock): void => {
    const w = window as unknown as { __spoken: string[]; __voiceUsed: string[]; SpeechSynthesisUtterance: unknown }
    w.__spoken = []
    w.__voiceUsed = []
    w.SpeechSynthesisUtterance = class {
        text: string
        lang = ''
        rate = 1
        voice: { lang: string; name: string } | null = null
        onend: (() => void) | null = null
        onerror: (() => void) | null = null
        constructor(text: string) {
            this.text = text
        }
    }
    Object.defineProperty(window, 'speechSynthesis', {
        configurable: true,
        value: {
            speak: (utterance: { text: string; lang: string; voice: { name: string } | null; onend: (() => void) | null }) => {
                w.__spoken.push(`${utterance.lang}|${utterance.text}`)
                w.__voiceUsed.push(utterance.voice?.name ?? '')
                setTimeout(() => utterance.onend?.(), 10)
            },
            cancel: () => undefined,
            getVoices: () => config.voices,
            addEventListener: () => undefined,
            removeEventListener: () => undefined,
        },
    })
}

const spoken = (page: Page): Promise<string[]> => page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken)

const prepare = async (page: Page): Promise<string> => {
    await login(page)
    await chooseProfile(page, PARENT_NAME)
    const suffix = randomUUID().slice(0, 6)
    const created = await page.request.post('/api/books', {
        data: {
            title: `Lecture ${suffix}`,
            kind: 'multi',
            imageDesc: '',
            pageFileIds: [],
            lines: [{ pageIndex: 0, character: 'Narrateur', text: 'Il était une fois un zébu.' }],
        },
    })
    const { id } = (await created.json()) as { id: string }
    const book = await apiJson<IBook>(page, `/books/${id}`)
    const members = await apiJson<{ id: string; name: string }[]>(page, '/members')
    const parentId = members.find(member => member.name === PARENT_NAME)!.id
    await page.request.patch(`/api/books/${id}`, {
        data: { lines: book.lines.map(line => ({ id: line.id, memberId: parentId })) },
    })
    return id
}

test.describe.configure({ mode: 'serial' })

test.describe('read aloud reading aid', () => {
    test('speaks the current line with the device voice and stores nothing', async ({ page }) => {
        await page.addInitScript(SPEECH_MOCK, { voices: [{ lang: 'fr-FR', name: 'Voix test' }] })
        const bookId = await prepare(page)
        let uploads = 0
        page.on('request', request => {
            if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/uploads') {
                uploads += 1
            }
        })
        await page.goto(`/books/${bookId}/studio`)
        const button = page.getByTestId('read-aloud')
        await expect(button).toBeVisible()
        await expect(button).toHaveAttribute('aria-pressed', 'false')
        expect(await spoken(page)).toEqual([])
        await button.click()
        await expect.poll(() => spoken(page)).toEqual(['fr-FR|Il était une fois un zébu.'])
        expect(await page.evaluate(() => (window as unknown as { __voiceUsed: string[] }).__voiceUsed)).toEqual(['Voix test'])
        await expect(page.getByTestId('read-aloud-missing')).toHaveCount(0)
        expect(uploads).toBe(0)
    })

    test('shows an explicit message when the device has no voice for the language', async ({ page }) => {
        await page.addInitScript(SPEECH_MOCK, { voices: [{ lang: 'en-US', name: 'English voice' }] })
        const bookId = await prepare(page)
        await page.goto(`/books/${bookId}/studio`)
        const button = page.getByTestId('read-aloud')
        await button.click()
        const message = page.getByTestId('read-aloud-missing')
        await expect(message).toBeVisible()
        await expect(message).toHaveAttribute('role', 'status')
        await expect(button).toHaveAttribute('aria-describedby', /read-aloud-missing/)
        expect(await spoken(page)).toEqual([])
    })

    test('is never offered to a child profile', async ({ page }) => {
        await page.addInitScript(SPEECH_MOCK, { voices: [{ lang: 'fr-FR', name: 'Voix test' }] })
        const bookId = await prepare(page)
        const name = `Petit${randomUUID().slice(0, 5)}`
        const child = await page.request.post('/api/members', { data: { name, role: 'child', color: 'sky', code: { kind: 'pin', value: PROFILE_PIN } } })
        expect(child.ok()).toBeTruthy()
        await useProfile(page.request, name)
        await page.goto(`/books/${bookId}/studio`)
        await page.waitForLoadState('networkidle')
        await expect(page.getByTestId('read-aloud')).toHaveCount(0)
    })
})
