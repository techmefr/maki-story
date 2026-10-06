import { expect, test } from '@playwright/test'
import type { APIRequestContext, Page } from '@playwright/test'
import { accountFor, chooseProfile, enterPin, login, makeWav, PARENT_NAME, PROFILE_PIN, signIn, useProfile, openMenuSection } from './helpers'

const CHILD = 'Zazashell'
const RELATIVE = 'Tantine'
const MIN_TARGET = 48
const DAYS = 7
const FULL_DAY = { isOpen: true, from: '00:00', to: '23:59' }

interface IApiPerson {
    id: string
    name: string
    role: string
}

const people = async (api: APIRequestContext): Promise<IApiPerson[]> => (await (await api.get('/api/members')).json()) as IApiPerson[]

const seedFamily = async (page: Page): Promise<{ childId: string; relativeId: string }> => {
    const existing = await people(page.request)
    for (const [name, role] of [
        [CHILD, 'child'],
        [RELATIVE, 'relative'],
    ] as const) {
        if (!existing.some(person => person.name === name)) {
            const created = await page.request.post('/api/members', { data: { name, role, color: role === 'child' ? 'sky' : 'pink', code: { kind: 'pin', value: PROFILE_PIN } } })
            expect(created.ok(), await created.text()).toBeTruthy()
        }
    }
    const all = await people(page.request)
    return { childId: all.find(person => person.name === CHILD)!.id, relativeId: all.find(person => person.name === RELATIVE)!.id }
}

const horizontalOverflow = (page: Page): Promise<number> =>
    page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)

const smallTargets = (page: Page): Promise<string[]> =>
    page.evaluate(min => {
        const selector = 'a[href], button, input:not([type=hidden]), select, textarea, [role=button], [role=switch], [role=tab]'
        return Array.from(document.querySelectorAll<HTMLElement>(selector))
            .filter(element => {
                const box = element.getBoundingClientRect()
                const style = getComputedStyle(element)
                if (box.width === 0 || box.height === 0 || style.visibility === 'hidden' || style.display === 'inline') {
                    return false
                }
                if (element.closest('.skip-link')) {
                    return false
                }
                return Math.min(box.width, box.height) < min - 0.5
            })
            .map(element => `${element.tagName.toLowerCase()}.${element.className} ${Math.round(element.getBoundingClientRect().width)}x${Math.round(element.getBoundingClientRect().height)} "${(element.textContent ?? '').trim().slice(0, 24)}"`)
    }, MIN_TARGET)

const expectTabs = async (page: Page, labels: string[]): Promise<void> => {
    const isWide = (page.viewportSize()?.width ?? 0) >= 720
    const links = isWide ? page.locator('.nav .nav__item') : page.locator('.tabbar__item')
    await page.waitForTimeout(800)
    await expect(links).toHaveText(labels)
}

test.describe('shell across viewports @viewport', () => {
    test('every route fits without horizontal scroll and keeps 48px targets', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await seedFamily(page)
        for (const path of ['/home', '/library', '/family', '/messages', '/notifications', '/profiles']) {
            await page.goto(path)
            await page.waitForLoadState('networkidle')
            expect(await horizontalOverflow(page), `horizontal scroll on ${path}`).toBeLessThanOrEqual(1)
            expect(await smallTargets(page), `small targets on ${path}`).toEqual([])
        }
        await chooseProfile(page, CHILD)
        for (const path of ['/kid', '/kid/library']) {
            await page.goto(path)
            await page.waitForLoadState('networkidle')
            expect(await horizontalOverflow(page), `horizontal scroll on ${path}`).toBeLessThanOrEqual(1)
            expect(await smallTargets(page), `small targets on ${path}`).toEqual([])
        }
        await chooseProfile(page, RELATIVE)
        await page.goto('/home')
        await page.waitForLoadState('networkidle')
        expect(await horizontalOverflow(page), 'horizontal scroll on relative home').toBeLessThanOrEqual(1)
        expect(await smallTargets(page), 'small targets on relative home').toEqual([])
    })

    test('the settings sheet traps the focus and closes with Escape', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.getByRole('button', { name: 'Réglages' }).click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        for (let step = 0; step < 40; step++) {
            await page.keyboard.press('Tab')
            expect(await page.evaluate(() => document.activeElement?.closest('[role="dialog"]') !== null), `focus left the sheet at step ${step}`).toBeTruthy()
        }
        await page.keyboard.press('Escape')
        await expect(dialog).toHaveCount(0)
    })
})

test.describe('shell per role', () => {
    test('the bottom bar and the home follow the role', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await seedFamily(page)
        await page.goto('/home')
        await expectTabs(page, ['Accueil', 'Bibliothèque', 'Famille'])
        await expect(page.getByTestId('relatives-grid')).toBeVisible()
        await expect(page.getByTestId('relatives-grid').getByText(CHILD)).toBeVisible()
        await expect(page.getByTestId('relatives-grid').getByText(RELATIVE)).toHaveCount(0)
        for (const id of ['proposals', 'drafts', 'to-record', 'recorded', 'review', 'trash']) {
            await expect(page.getByTestId(`home-count-${id}`)).toHaveText(/^\d+$/)
        }
        await expect(page.getByTestId('home-kid-all')).toBeVisible()

        await chooseProfile(page, CHILD)
        await page.goto('/kid')
        await expectTabs(page, ['Accueil', 'Coffre', 'Bibliothèque'])
        await expect(page.getByRole('heading', { name: /Coucou/ })).toBeVisible()
        await expect(page.locator('.hello svg[viewBox="0 0 120 120"]')).toHaveCount(0)

        await chooseProfile(page, RELATIVE)
        await page.goto('/home')
        await expectTabs(page, [])
        await expect(page.getByTestId('relatives-grid')).toBeVisible()
        await page.goto('/family')
        await expect(page).toHaveURL(/\/home/)
    })

    test('the family routes answer 403 to relatives and children', async ({ page, playwright, baseURL }, info) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await seedFamily(page)
        const account = accountFor(info.project.name)
        const probes: [string, string][] = [
            ['GET', '/api/family/export'],
            ['GET', '/api/family/activity'],
            ['GET', '/api/family/invite'],
            ['POST', '/api/family/invite/rotate'],
            ['DELETE', '/api/family'],
            ['GET', '/api/trash'],
            ['POST', '/api/members'],
        ]
        for (const name of [RELATIVE, CHILD]) {
            const api = await playwright.request.newContext({ baseURL })
            await signIn(api, account)
            expect((await api.post('/api/auth/profile', { data: { memberId: null } })).ok()).toBeTruthy()
            const member = (await people(api)).find(person => person.name === name)!
            expect((await api.post('/api/auth/profile', { data: { memberId: member.id, code: PROFILE_PIN } })).ok()).toBeTruthy()
            for (const [method, path] of probes) {
                const response = await api.fetch(path, { method, data: method === 'GET' ? undefined : {} })
                expect(response.status(), `${name} ${method} ${path}`).toBe(403)
            }
            await api.dispose()
        }
    })

    test('the logout button asks for a parent code and there is no add button', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.goto('/profiles')
        await expect(page.getByRole('heading', { name: 'Qui est-ce ?' })).toBeVisible()
        await expect(page.locator('.picker-screen .maki, .picker-screen svg[viewBox="0 0 120 120"]')).toHaveCount(0)
        await expect(page.getByTestId('add-member')).toHaveCount(0)
        await page.getByTestId('logout').click()
        await expect(page.getByRole('heading', { name: 'Code d’un parent' })).toBeVisible()
        await enterPin(page, '9999')
        await expect(page.getByRole('alert')).toBeVisible()
        await expect(page).toHaveURL(/\/profiles/)
        await page.getByRole('button', { name: 'Annuler' }).click()
        await expect(page.getByRole('heading', { name: 'Qui est-ce ?' })).toBeVisible()
    })

    test('the book search opens from the button, the keyboard and a swipe', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.goto('/home')
        const open = page.getByTestId('book-search-open')
        await expect(open).toBeVisible()
        await open.focus()
        await page.keyboard.press('Enter')
        await expect(page.getByTestId('book-search')).toBeVisible()
        await page.keyboard.press('Escape')
        await expect(page.getByTestId('book-search')).toHaveCount(0)
        await page.evaluate(() => {
            const touch = (x: number): Touch => new Touch({ identifier: 1, target: document.body, clientX: x, clientY: 300 })
            document.dispatchEvent(new TouchEvent('touchstart', { touches: [touch(320)], changedTouches: [touch(320)] }))
            document.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [touch(120)] }))
        })
        await expect(page.getByTestId('book-search')).toBeVisible()
        await page.locator('[data-filter="type-comic"]').click()
        await page.getByTestId('book-search-go').click()
        await expect(page).toHaveURL(/\/library\?type=comic/)
        await page.getByTestId('filters-open').click()
        await expect(page.locator('[data-filter="type-comic"]')).toHaveAttribute('aria-pressed', 'true')
    })

    test('the bell is grey with nothing new and turns colored with a red counter', async ({ page, playwright, baseURL }, info) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const { relativeId } = await seedFamily(page)
        expect((await page.request.post('/api/notifications/read', { data: {} })).ok()).toBeTruthy()
        await page.goto('/home')
        const bell = page.getByTestId('bell')
        await expect(bell).toHaveClass(/bell--idle/)
        await expect(bell.locator('.bell__count')).toHaveCount(0)
        const relative = await playwright.request.newContext({ baseURL })
        await signIn(relative, accountFor(info.project.name))
        await useProfile(relative, RELATIVE)
        const proposed = await relative.post('/api/books', {
            data: { title: 'Proposition cloche', kind: 'solo', soloMemberId: relativeId, isProposal: true, imageDesc: '', pageFileIds: [], lines: [{ pageIndex: 0, character: '', text: 'Texte' }] },
        })
        expect(proposed.ok(), await proposed.text()).toBeTruthy()
        await relative.dispose()
        await page.goto('/home')
        await expect(bell).not.toHaveClass(/bell--idle/)
        await expect(bell.locator('.bell__count')).toBeVisible()
        await expect(bell.locator('svg')).toHaveCount(1)
    })

    test('an unheard message puts a ring on the relative face of the child and opens the playback', async ({ page, playwright, baseURL }, info) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const { childId, relativeId } = await seedFamily(page)
        const relative = await playwright.request.newContext({ baseURL })
        await signIn(relative, accountFor(info.project.name))
        await useProfile(relative, RELATIVE)
        const upload = await relative.post('/api/files', { data: makeWav(300), headers: { 'content-type': 'audio/wav' } })
        const fileId = ((await upload.json()) as { id: string }).id
        const sent = await relative.post('/api/messages', { data: { fromMemberId: relativeId, toMemberId: childId, fileId, mime: 'audio/wav', durationMs: 300 } })
        expect(sent.ok(), await sent.text()).toBeTruthy()
        await relative.dispose()
        await chooseProfile(page, CHILD)
        await page.goto('/kid')
        const card = page.locator('.face__link', { hasText: RELATIVE })
        await expect(card).toHaveAttribute('data-ring', 'unheard')
        await card.click()
        await expect(page).toHaveURL(/\/message\/listen\//)
    })
})

test.describe('settings, theme and header', () => {
    test('the header shows the gear and no feedback button, the sheet closes with an X', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await expect(page.getByTestId('settings-open')).toBeVisible()
        await expect(page.getByTestId('profile-open')).toBeVisible()
        await expect(page.locator('header').getByRole('button', { name: 'Avis' })).toHaveCount(0)
        await page.getByTestId('profile-open').click()
        await expect(page.getByTestId('profile-card')).toBeVisible()
        await page.keyboard.press('Escape')
        await page.getByTestId('settings-open').click()
        await expect(page.getByRole('dialog').getByText('Thème')).toBeVisible()
        await expect(page.getByRole('dialog').getByRole('button', { name: 'Donner mon avis' })).toBeVisible()
        await page.getByTestId('settings-close').click()
        await expect(page.getByRole('dialog')).toHaveCount(0)
    })

    test('the theme persists per profile without a flash and keeps readable contrast', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await page.getByTestId('settings-open').click()
        await openMenuSection(page, 'Thème')
        await page.locator('[data-theme-choice="dark"]').click()
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
        await page.getByTestId('settings-close').click()
        await page.reload()
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
        const ratios = await page.evaluate(() => {
            const style = getComputedStyle(document.documentElement)
            const read = (name: string): number[] => {
                const hex = style.getPropertyValue(name).trim().replace('#', '')
                const full = hex.length === 3 ? hex.split('').map(char => char + char).join('') : hex
                return [0, 2, 4].map(index => parseInt(full.slice(index, index + 2), 16))
            }
            const luminance = (rgb: number[]): number => {
                const [r, g, b] = rgb.map(value => {
                    const channel = value / 255
                    return channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
                })
                return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!
            }
            const ratio = (a: string, b: string): number => {
                const [high, low] = [luminance(read(a)), luminance(read(b))].sort((x, y) => y - x)
                return (high! + 0.05) / (low! + 0.05)
            }
            return {
                text: ratio('--ink', '--bg'),
                card: ratio('--ink', '--paper'),
                soft: ratio('--ink-soft', '--bg'),
                danger: ratio('--danger', '--bg'),
                sun: ratio('--on-accent', '--yellow'),
                sky: ratio('--on-accent', '--sky'),
                mint: ratio('--on-accent', '--mint'),
                coral: ratio('--on-accent', '--coral'),
                idle: ratio('--grey-ui-ink', '--grey-ui'),
            }
        })
        for (const [name, value] of Object.entries(ratios)) {
            expect(value, `contrast ${name}`).toBeGreaterThanOrEqual(4.5)
        }
        await page.getByTestId('settings-open').click()
        await openMenuSection(page, 'Thème')
        await page.locator('[data-theme-choice="light"]').click()
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
    })

    test('the child settings keep only the allowed sections', async ({ page }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        await seedFamily(page)
        await chooseProfile(page, CHILD)
        await page.goto('/kid')
        await page.getByTestId('settings-open').click()
        const dialog = page.getByRole('dialog')
        await expect(dialog.getByText('Thème')).toBeVisible()
        await expect(dialog.getByText('Taille du texte')).toBeVisible()
        await expect(dialog.getByText('Langue de l’application')).toBeVisible()
        await expect(dialog.getByText('Sons')).toBeVisible()
        await expect(dialog.getByRole('button', { name: 'Changer de profil' })).toBeVisible()
        await expect(dialog.getByText('Espace parent')).toHaveCount(0)
        await expect(dialog.getByText('Mot de passe du compte')).toHaveCount(0)
        await expect(dialog.getByRole('button', { name: 'Donner mon avis' })).toHaveCount(0)
    })
})

test.describe('parental lock without a connection', () => {
    test.use({ timezoneId: 'UTC' })

    test('the child locks at the cut-off with no network', async ({ page, context }) => {
        test.setTimeout(240_000)
        const now = new Date()
        const minutes = now.getUTCHours() * 60 + now.getUTCMinutes()
        test.skip(minutes > 23 * 60 + 55, 'too close to midnight UTC')
        const cutOff = minutes + 2
        const to = `${String(Math.floor(cutOff / 60)).padStart(2, '0')}:${String(cutOff % 60).padStart(2, '0')}`
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const { childId } = await seedFamily(page)
        const weekly = Array.from({ length: DAYS }, () => ({ isOpen: true, from: '00:00', to }))
        expect((await page.request.put(`/api/members/${childId}/schedule`, { data: { isEnabled: true, weekly, timezone: 'UTC' } })).ok()).toBeTruthy()
        await chooseProfile(page, CHILD)
        await page.goto('/kid')
        await expect(page.getByRole('heading', { name: /Coucou/ })).toBeVisible()
        await page.waitForTimeout(2500)
        await context.setOffline(true)
        await expect(page).toHaveURL(/\/kid\/locked/,{ timeout: 200_000 })
        await expect(page.getByTestId('locked-screen')).toContainText('L’app dort')
        await context.setOffline(false)
    })

    test('a parent code lifts the lock for a while and the override is audited', async ({ page, playwright, baseURL }, info) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const { childId } = await seedFamily(page)
        expect((await page.request.put(`/api/members/${childId}/access-block`, { data: { mode: 'now' } })).ok()).toBeTruthy()
        const child = await playwright.request.newContext({ baseURL })
        await signIn(child, accountFor(info.project.name))
        expect((await child.post('/api/auth/profile', { data: { memberId: childId, code: PROFILE_PIN } })).ok()).toBeTruthy()
        const parentId = (await people(page.request)).find(person => person.name === PARENT_NAME)!.id
        const refused = await child.post('/api/access/override', { data: { parentId, code: '0000' } })
        expect(refused.status()).toBe(403)
        const granted = await child.post('/api/access/override', { data: { parentId, code: PROFILE_PIN } })
        expect(granted.ok(), await granted.text()).toBeTruthy()
        const snapshot = (await granted.json()) as { isAllowed: boolean; overrideUntil: string | null }
        expect(snapshot.isAllowed).toBe(true)
        expect(Date.parse(snapshot.overrideUntil!)).toBeGreaterThan(Date.now())
        expect((await child.get('/api/books')).ok()).toBeTruthy()
        const activity = (await (await page.request.get('/api/family/activity')).json()) as { items: { action: string }[] }
        expect(activity.items.some(entry => entry.action === 'member.access.override')).toBe(true)
        await child.dispose()
    })
})

test.describe('offline send queue', () => {
    test('a message recorded offline is kept and sent when the connection returns', async ({ page, context }) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const { childId } = await seedFamily(page)
        await page.goto(`/message/${childId}`)
        await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeVisible()
        await context.setOffline(true)
        await page.getByRole('button', { name: 'Enregistrer' }).click()
        await expect(page.getByRole('button', { name: 'Arrêter' })).toBeVisible()
        await page.waitForTimeout(1300)
        await page.getByRole('button', { name: 'Arrêter' }).click()
        await page.getByRole('button', { name: 'Envoyer', exact: true }).click()
        await expect(page.getByText('Message en attente')).toBeVisible()
        const queued = await page.evaluate(
            () =>
                new Promise<number>(resolve => {
                    const opening = indexedDB.open('tantara-offline')
                    opening.onsuccess = () => {
                        const request = opening.result.transaction('outbox', 'readonly').objectStore('outbox').count()
                        request.onsuccess = () => resolve(request.result)
                    }
                }),
        )
        expect(queued).toBe(1)
        await context.setOffline(false)
        await expect.poll(async () => ((await (await page.request.get('/api/messages')).json()) as unknown[]).length, { timeout: 30_000 }).toBeGreaterThan(0)
        await expect(page.getByTestId('outbox-pill')).toHaveText(/Envoyé/, { timeout: 40_000 })
        await page.getByTestId('outbox-pill').click()
        await expect(page.getByTestId('outbox-sheet').locator('[data-status="sent"]')).toBeVisible()
    })
})
