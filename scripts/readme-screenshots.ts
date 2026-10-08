import { expect, request, test } from '@playwright/test'
import type { APIRequestContext, Browser, BrowserContext, Page } from '@playwright/test'
import { chooseProfile, makeWav, openMenuSection, PROFILE_PIN, startBook, toPages, useProfile } from '../tests/e2e/helpers'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const OUTPUT_DIRECTORY = join(dirname(fileURLToPath(import.meta.url)), '..', 'docs', 'screenshots')
const FAMILY_EMAIL = 'camille.moreau@example.test'
const FAMILY_PASSWORD = 'readme-password-123'
const PARENT = 'Camille'
const LOLA = 'Lola'
const NOE = 'Noé'
const ODILE = 'Mamie Odile'
const REMI = 'Tonton Rémi'

type Shape =
    | { kind: 'circle'; x: number; y: number; r: number; color: string }
    | { kind: 'ellipse'; x: number; y: number; rx: number; ry: number; color: string }
    | { kind: 'rect'; x: number; y: number; w: number; h: number; color: string }
    | { kind: 'triangle'; points: [number, number][]; color: string }

interface IArt {
    top: string
    bottom: string
    shapes: Shape[]
}

interface IBookPlan {
    title: string
    subtitle: string
    author: string
    ageMin: number
    ageMax: number
    status: 'ready' | 'in_review' | 'to_record'
    cover: IArt
    narrator: string
    hero: string
    heroColor: string
    lines: { character: string; text: string; reader: string }[]
}

const STARS: Shape[] = [
    { kind: 'circle', x: 90, y: 90, r: 7, color: '#FFF3DC' },
    { kind: 'circle', x: 470, y: 130, r: 5, color: '#FFF3DC' },
    { kind: 'circle', x: 300, y: 60, r: 6, color: '#FFF3DC' },
    { kind: 'circle', x: 520, y: 300, r: 4, color: '#FFF3DC' },
    { kind: 'circle', x: 70, y: 320, r: 5, color: '#FFF3DC' },
]

const hills = (back: string, front: string): Shape[] => [
    { kind: 'ellipse', x: 150, y: 780, rx: 330, ry: 190, color: back },
    { kind: 'ellipse', x: 470, y: 820, rx: 330, ry: 180, color: front },
]

const PLANS: IBookPlan[] = [
    {
        title: 'Le renard des brumes',
        subtitle: 'Une nuit dans la forêt',
        author: 'Anaïs Verdier',
        ageMin: 4,
        ageMax: 6,
        status: 'ready',
        cover: {
            top: '#1E1A3F',
            bottom: '#6DB5FF',
            shapes: [
                ...STARS,
                { kind: 'circle', x: 440, y: 190, r: 80, color: '#FFF3DC' },
                ...hills('#2C6E63', '#4AD3A5'),
                { kind: 'ellipse', x: 300, y: 560, rx: 120, ry: 75, color: '#FF7766' },
                { kind: 'triangle', points: [[225, 505], [255, 410], [300, 490]], color: '#FF7766' },
                { kind: 'triangle', points: [[300, 490], [345, 410], [375, 505]], color: '#FF7766' },
                { kind: 'circle', x: 300, y: 540, r: 40, color: '#FFF3DC' },
            ],
        },
        narrator: 'Narratrice',
        hero: 'Renard',
        heroColor: 'coral',
        lines: [
            { character: 'Narratrice', text: 'La brume montait doucement sur la forêt endormie.', reader: ODILE },
            { character: 'Renard', text: 'Qui va là ? demanda le petit renard.', reader: REMI },
            { character: 'Narratrice', text: 'Un hibou lui fit un clin d’œil depuis sa branche.', reader: ODILE },
            { character: 'Renard', text: 'Alors je ne suis pas seul cette nuit.', reader: REMI },
        ],
    },
    {
        title: 'La baleine qui chantait',
        subtitle: 'Un chant venu de la mer',
        author: 'Maël Sorel',
        ageMin: 3,
        ageMax: 5,
        status: 'ready',
        cover: {
            top: '#6DB5FF',
            bottom: '#1E1A3F',
            shapes: [
                { kind: 'circle', x: 110, y: 120, r: 55, color: '#FFC933' },
                { kind: 'ellipse', x: 300, y: 520, rx: 210, ry: 110, color: '#B28DFF' },
                { kind: 'triangle', points: [[470, 520], [570, 430], [560, 580]], color: '#B28DFF' },
                { kind: 'circle', x: 215, y: 495, r: 14, color: '#1E1A3F' },
                { kind: 'ellipse', x: 150, y: 760, rx: 260, ry: 80, color: '#4AD3A5' },
                { kind: 'ellipse', x: 480, y: 790, rx: 260, ry: 80, color: '#6DB5FF' },
            ],
        },
        narrator: 'Narrateur',
        hero: 'Baleine',
        heroColor: 'grape',
        lines: [
            { character: 'Narrateur', text: 'Au large, une baleine fredonnait chaque soir.', reader: REMI },
            { character: 'Baleine', text: 'Ma chanson fera le tour du monde.', reader: ODILE },
            { character: 'Narrateur', text: 'Les vagues dansaient en rythme.', reader: REMI },
            { character: 'Baleine', text: 'Chantez avec moi, les étoiles !', reader: ODILE },
        ],
    },
    {
        title: 'Le petit nuage voyageur',
        subtitle: 'Du vent plein les poches',
        author: 'Élise Bernier',
        ageMin: 3,
        ageMax: 6,
        status: 'ready',
        cover: {
            top: '#8CC6FF',
            bottom: '#FFF3DC',
            shapes: [
                { kind: 'circle', x: 460, y: 140, r: 70, color: '#FFC933' },
                { kind: 'ellipse', x: 290, y: 400, rx: 150, ry: 80, color: '#FFFFFF' },
                { kind: 'circle', x: 210, y: 380, r: 70, color: '#FFFFFF' },
                { kind: 'circle', x: 330, y: 350, r: 85, color: '#FFFFFF' },
                { kind: 'circle', x: 255, y: 395, r: 8, color: '#1E1A3F' },
                { kind: 'circle', x: 330, y: 395, r: 8, color: '#1E1A3F' },
                ...hills('#4AD3A5', '#2C6E63'),
            ],
        },
        narrator: 'Narratrice',
        hero: 'Nuage',
        heroColor: 'sky',
        lines: [
            { character: 'Narratrice', text: 'Un petit nuage rêvait de voir la montagne.', reader: ODILE },
            { character: 'Nuage', text: 'Souffle, vent, emmène-moi là-bas !', reader: PARENT },
            { character: 'Narratrice', text: 'Et le vent le porta par-dessus les toits.', reader: ODILE },
            { character: 'Nuage', text: 'Que le monde est grand vu d’ici.', reader: PARENT },
        ],
    },
    {
        title: 'Le train des étoiles',
        subtitle: 'Départ à minuit',
        author: 'Gaspard Lemoine',
        ageMin: 6,
        ageMax: 9,
        status: 'ready',
        cover: {
            top: '#1E1A3F',
            bottom: '#B28DFF',
            shapes: [
                ...STARS,
                { kind: 'circle', x: 120, y: 220, r: 6, color: '#FFC933' },
                { kind: 'rect', x: 120, y: 480, w: 360, h: 100, color: '#FF8FC9' },
                { kind: 'rect', x: 380, y: 400, w: 100, h: 80, color: '#FF8FC9' },
                { kind: 'circle', x: 190, y: 600, r: 32, color: '#1E1A3F' },
                { kind: 'circle', x: 300, y: 600, r: 32, color: '#1E1A3F' },
                { kind: 'circle', x: 410, y: 600, r: 32, color: '#1E1A3F' },
                { kind: 'rect', x: 0, y: 630, w: 600, h: 16, color: '#FFF3DC' },
            ],
        },
        narrator: 'Narrateur',
        hero: 'Contrôleur',
        heroColor: 'sun',
        lines: [
            { character: 'Narrateur', text: 'À minuit pile, le train des étoiles quitta la gare.', reader: REMI },
            { character: 'Contrôleur', text: 'Vos billets, s’il vous plaît, voyageurs !', reader: PARENT },
            { character: 'Narrateur', text: 'Par la fenêtre, la Lune faisait des signes.', reader: REMI },
            { character: 'Contrôleur', text: 'Prochain arrêt, la Voie lactée.', reader: PARENT },
        ],
    },
    {
        title: 'Les trois lutins du lac',
        subtitle: 'Une histoire de pêche',
        author: 'Capucine Aubry',
        ageMin: 4,
        ageMax: 7,
        status: 'ready',
        cover: {
            top: '#FFF3DC',
            bottom: '#4AD3A5',
            shapes: [
                { kind: 'ellipse', x: 300, y: 620, rx: 290, ry: 130, color: '#6DB5FF' },
                { kind: 'triangle', points: [[130, 420], [185, 270], [240, 420]], color: '#FF7766' },
                { kind: 'triangle', points: [[250, 420], [305, 250], [360, 420]], color: '#FFC933' },
                { kind: 'triangle', points: [[370, 420], [425, 290], [480, 420]], color: '#B28DFF' },
                { kind: 'circle', x: 185, y: 440, r: 30, color: '#FFD9B3' },
                { kind: 'circle', x: 305, y: 440, r: 30, color: '#FFD9B3' },
                { kind: 'circle', x: 425, y: 440, r: 30, color: '#FFD9B3' },
            ],
        },
        narrator: 'Narratrice',
        hero: 'Lutin',
        heroColor: 'mint',
        lines: [
            { character: 'Narratrice', text: 'Trois lutins pêchaient au bord du lac.', reader: ODILE },
            { character: 'Lutin', text: 'Moi, j’ai attrapé une botte !', reader: REMI },
            { character: 'Narratrice', text: 'Le soleil riait dans l’eau claire.', reader: ODILE },
            { character: 'Lutin', text: 'Demain, on pêchera des étoiles.', reader: REMI },
        ],
    },
    {
        title: 'Ours en pyjama',
        subtitle: 'Dodo, mon grand',
        author: 'Anaïs Verdier',
        ageMin: 2,
        ageMax: 4,
        status: 'in_review',
        cover: {
            top: '#FF8FC9',
            bottom: '#FFF3DC',
            shapes: [
                { kind: 'circle', x: 210, y: 330, r: 45, color: '#B5835A' },
                { kind: 'circle', x: 390, y: 330, r: 45, color: '#B5835A' },
                { kind: 'circle', x: 300, y: 430, r: 130, color: '#B5835A' },
                { kind: 'circle', x: 255, y: 410, r: 12, color: '#1E1A3F' },
                { kind: 'circle', x: 345, y: 410, r: 12, color: '#1E1A3F' },
                { kind: 'ellipse', x: 300, y: 460, rx: 38, ry: 26, color: '#FFD9B3' },
                { kind: 'rect', x: 190, y: 560, w: 220, h: 170, color: '#6DB5FF' },
                ...hills('#B28DFF', '#FF7766'),
            ],
        },
        narrator: 'Narrateur',
        hero: 'Ours',
        heroColor: 'pink',
        lines: [
            { character: 'Narrateur', text: 'Le petit ours enfila son pyjama à rayures.', reader: REMI },
            { character: 'Ours', text: 'Je n’ai pas sommeil du tout !', reader: ODILE },
            { character: 'Narrateur', text: 'Mais ses yeux se fermaient tout seuls.', reader: REMI },
            { character: 'Ours', text: 'Bonne nuit, tout le monde.', reader: ODILE },
        ],
    },
    {
        title: 'Le jardin de Poppy',
        subtitle: 'Des fleurs pour tous',
        author: 'Élise Bernier',
        ageMin: 3,
        ageMax: 5,
        status: 'to_record',
        cover: {
            top: '#FFC933',
            bottom: '#FFF3DC',
            shapes: [
                { kind: 'rect', x: 0, y: 560, w: 600, h: 240, color: '#4AD3A5' },
                { kind: 'rect', x: 140, y: 400, w: 12, h: 180, color: '#2C6E63' },
                { kind: 'rect', x: 290, y: 330, w: 12, h: 250, color: '#2C6E63' },
                { kind: 'rect', x: 440, y: 420, w: 12, h: 160, color: '#2C6E63' },
                { kind: 'circle', x: 146, y: 390, r: 48, color: '#FF7766' },
                { kind: 'circle', x: 296, y: 320, r: 55, color: '#FF8FC9' },
                { kind: 'circle', x: 446, y: 410, r: 46, color: '#B28DFF' },
                { kind: 'circle', x: 296, y: 320, r: 18, color: '#FFC933' },
            ],
        },
        narrator: 'Narratrice',
        hero: 'Poppy',
        heroColor: 'pink',
        lines: [
            { character: 'Narratrice', text: 'Poppy arrosait son jardin chaque matin.', reader: ODILE },
            { character: 'Poppy', text: 'Poussez, mes petites fleurs !', reader: ODILE },
            { character: 'Narratrice', text: 'Les abeilles arrivèrent en bourdonnant.', reader: ODILE },
            { character: 'Poppy', text: 'Il y en a pour tout le monde.', reader: ODILE },
        ],
    },
]

const PAGE_ART: IArt[] = [
    { top: '#8CC6FF', bottom: '#FFF3DC', shapes: [{ kind: 'circle', x: 300, y: 260, r: 90, color: '#FFC933' }, ...hills('#4AD3A5', '#2C6E63')] },
    { top: '#1E1A3F', bottom: '#6DB5FF', shapes: [...STARS, { kind: 'circle', x: 300, y: 300, r: 110, color: '#FFF3DC' }, ...hills('#2C6E63', '#4AD3A5')] },
]

interface IFamilyIds {
    parent: string
    lola: string
    noe: string
    odile: string
    remi: string
}

interface IApiMember {
    id: string
    name: string
}

interface IApiBook {
    lines: { id: string }[]
}

const drawArt = async (page: Page, art: IArt): Promise<Buffer> => {
    const dataUrl = await page.evaluate((spec: IArt): string => {
        const canvas = document.createElement('canvas')
        canvas.width = 600
        canvas.height = 800
        const context = canvas.getContext('2d')!
        const gradient = context.createLinearGradient(0, 0, 0, 800)
        gradient.addColorStop(0, spec.top)
        gradient.addColorStop(1, spec.bottom)
        context.fillStyle = gradient
        context.fillRect(0, 0, 600, 800)
        for (const shape of spec.shapes) {
            context.fillStyle = shape.color
            context.beginPath()
            if (shape.kind === 'circle') {
                context.arc(shape.x, shape.y, shape.r, 0, Math.PI * 2)
            } else if (shape.kind === 'ellipse') {
                context.ellipse(shape.x, shape.y, shape.rx, shape.ry, 0, 0, Math.PI * 2)
            } else if (shape.kind === 'rect') {
                context.rect(shape.x, shape.y, shape.w, shape.h)
            } else {
                shape.points.forEach(([x, y], index) => (index === 0 ? context.moveTo(x, y) : context.lineTo(x, y)))
                context.closePath()
            }
            context.fill()
        }
        return canvas.toDataURL('image/png')
    }, art)
    return Buffer.from(dataUrl.split(',')[1]!, 'base64')
}

const uploadImage = async (api: APIRequestContext, image: Buffer): Promise<string> => {
    const response = await api.post('/api/files', { data: image, headers: { 'content-type': 'image/png' } })
    expect(response.ok(), await response.text()).toBeTruthy()
    return ((await response.json()) as { id: string }).id
}

const uploadTone = async (api: APIRequestContext, ms: number): Promise<string> => {
    const response = await api.post('/api/files', { data: makeWav(ms), headers: { 'content-type': 'audio/wav' } })
    expect(response.ok(), await response.text()).toBeTruthy()
    return ((await response.json()) as { id: string }).id
}

const memberApi = async (baseURL: string, name: string): Promise<APIRequestContext> => {
    const api = await request.newContext({ baseURL })
    const login = await api.post('/api/auth/login', { data: { email: FAMILY_EMAIL, password: FAMILY_PASSWORD } })
    expect(login.ok(), await login.text()).toBeTruthy()
    await useProfile(api, name)
    return api
}

const addMember = async (parent: APIRequestContext, name: string, role: 'child' | 'relative', color: string, birthDate?: string): Promise<string> => {
    const code = role === 'child' ? { kind: 'symbols', value: '0000' } : { kind: 'pin', value: PROFILE_PIN }
    const response = await parent.post('/api/members', { data: { name, role, color, code, birthDate } })
    expect(response.status(), await response.text()).toBe(200)
    return ((await response.json()) as { id: string }).id
}

const seedBook = async (parent: APIRequestContext, artPage: Page, plan: IBookPlan, ids: Record<string, string>, readers: Record<string, APIRequestContext>): Promise<string> => {
    const coverId = await uploadImage(parent, await drawArt(artPage, plan.cover))
    const pageIds = await Promise.all(PAGE_ART.map(async art => uploadImage(parent, await drawArt(artPage, art))))
    const created = await parent.post('/api/books', {
        data: {
            title: plan.title,
            subtitle: plan.subtitle,
            author: plan.author,
            ageMin: plan.ageMin,
            ageMax: plan.ageMax,
            language: 'fr',
            kind: 'multi',
            imageDesc: '',
            pageFileIds: [],
            pages: [{ fileId: coverId, kind: 'cover' }, ...pageIds.map(fileId => ({ fileId, kind: 'content' }))],
            characters: [
                { name: plan.narrator, isNarrator: true, description: '' },
                { name: plan.hero, color: plan.heroColor, description: '' },
            ],
            lines: plan.lines.map((line, index) => ({ pageIndex: index < 2 ? 0 : 1, character: line.character, text: line.text })),
        },
    })
    expect(created.ok(), await created.text()).toBeTruthy()
    const { id } = (await created.json()) as { id: string }
    const book = (await (await parent.get(`/api/books/${id}`)).json()) as IApiBook
    const assigned = await parent.patch(`/api/books/${id}`, {
        data: { lines: book.lines.map((line, index) => ({ id: line.id, memberId: ids[plan.lines[index]!.reader] })) },
    })
    expect(assigned.ok(), await assigned.text()).toBeTruthy()
    for (const [index, line] of book.lines.entries()) {
        const reader = readers[plan.lines[index]!.reader]!
        const isMissing = plan.status === 'to_record' && index > 1
        if (isMissing) {
            continue
        }
        const fileId = await uploadTone(reader, 900 + index * 250)
        const response = await reader.put(`/api/books/${id}/lines/${line.id}/audio`, { data: { fileId, ms: 900 + index * 250 } })
        expect(response.status(), await response.text()).toBe(200)
    }
    if (plan.status === 'ready') {
        const ready = await parent.patch(`/api/books/${id}`, { data: { status: 'ready' } })
        expect(ready.ok(), await ready.text()).toBeTruthy()
    } else if (plan.status === 'in_review') {
        for (const name of [ODILE, REMI]) {
            await readers[name]!.post(`/api/books/${id}/submit`, { data: {} })
        }
    }
    return id
}

const sendMessage = async (from: APIRequestContext, toMemberId: string, ms: number): Promise<void> => {
    const fileId = await uploadTone(from, ms)
    const response = await from.post('/api/messages', { data: { toMemberId, fileId, mime: 'audio/wav', durationMs: ms } })
    expect(response.ok(), await response.text()).toBeTruthy()
}

const openContext = async (browser: Browser, baseURL: string, viewport: { width: number; height: number }, isMobile: boolean): Promise<BrowserContext> => {
    return browser.newContext({
        baseURL,
        viewport,
        isMobile,
        hasTouch: isMobile,
        deviceScaleFactor: isMobile ? 2 : 1,
        locale: 'fr-FR',
        permissions: ['microphone'],
        reducedMotion: 'reduce',
    })
}

const signedInPage = async (browser: Browser, baseURL: string, name: string, viewport = { width: 390, height: 844 }, isMobile = true): Promise<Page> => {
    const context = await openContext(browser, baseURL, viewport, isMobile)
    const login = await context.request.post('/api/auth/login', { data: { email: FAMILY_EMAIL, password: FAMILY_PASSWORD } })
    expect(login.ok(), await login.text()).toBeTruthy()
    const page = await context.newPage()
    await chooseProfile(page, name)
    return page
}

const capture = async (page: Page, name: string): Promise<void> => {
    await page.waitForLoadState('networkidle')
    await page.addStyleTag({ content: 'a[href="/grimace"] { display: none !important; }' })
    await page.waitForTimeout(600)
    await page.screenshot({ path: join(OUTPUT_DIRECTORY, `${name}.png`) })
}

test('regenerates the README screenshots with a fictional family', async ({ browser, baseURL }) => {
    test.setTimeout(600_000)
    const origin = baseURL!
    const api = await request.newContext({ baseURL: origin })
    const registered = await api.post('/api/auth/register', {
        data: { email: FAMILY_EMAIL, password: FAMILY_PASSWORD, familyName: 'Famille Moreau', parentName: PARENT },
    })
    expect(registered.ok(), await registered.text()).toBeTruthy()
    await useProfile(api, PARENT)

    const ids: IFamilyIds = {
        parent: ((await (await api.get('/api/members')).json()) as IApiMember[]).find(member => member.name === PARENT)!.id,
        lola: await addMember(api, LOLA, 'child', 'pink', '2021-03-14'),
        noe: await addMember(api, NOE, 'child', 'sky', '2022-09-03'),
        odile: await addMember(api, ODILE, 'relative', 'grape'),
        remi: await addMember(api, REMI, 'relative', 'sun'),
    }
    const idByName: Record<string, string> = { [PARENT]: ids.parent, [LOLA]: ids.lola, [NOE]: ids.noe, [ODILE]: ids.odile, [REMI]: ids.remi }
    const readers: Record<string, APIRequestContext> = {
        [PARENT]: api,
        [ODILE]: await memberApi(origin, ODILE),
        [REMI]: await memberApi(origin, REMI),
    }
    const lola = await memberApi(origin, LOLA)
    const noe = await memberApi(origin, NOE)

    const artContext = await browser.newContext()
    const artPage = await artContext.newPage()
    await artPage.goto('about:blank')
    const bookIds: Record<string, string> = {}
    for (const plan of PLANS) {
        bookIds[plan.title] = await seedBook(api, artPage, plan, idByName, readers)
    }
    const newBookCover = await drawArt(artPage, PLANS[1]!.cover)
    const newBookPage = await drawArt(artPage, PAGE_ART[0]!)
    await artContext.close()

    await sendMessage(readers[ODILE]!, ids.lola, 2400)
    await sendMessage(readers[REMI]!, ids.lola, 1800)
    await sendMessage(readers[ODILE]!, ids.noe, 2100)
    await sendMessage(lola, ids.odile, 1500)
    await sendMessage(noe, ids.remi, 1700)

    const loginContext = await openContext(browser, origin, { width: 390, height: 844 }, true)
    const loginPage = await loginContext.newPage()
    await loginPage.goto('/login')
    await loginPage.locator('input[type="email"]').fill(FAMILY_EMAIL)
    await capture(loginPage, 'login')
    await loginContext.close()

    const pickerContext = await openContext(browser, origin, { width: 390, height: 844 }, true)
    await pickerContext.request.post('/api/auth/login', { data: { email: FAMILY_EMAIL, password: FAMILY_PASSWORD } })
    const pickerPage = await pickerContext.newPage()
    await pickerPage.goto('/profiles')
    await expect(pickerPage.locator('button.card').first()).toBeVisible()
    await capture(pickerPage, 'profiles')
    await pickerContext.close()

    const kid = await signedInPage(browser, origin, LOLA)
    await kid.goto('/kid')
    await capture(kid, 'kid-home')
    await kid.goto('/kid/library')
    await expect(kid.locator('img.cover__image').first()).toBeVisible()
    await capture(kid, 'kid-library')
    await kid.getByTestId('filters-open').click()
    await capture(kid, 'kid-library-filters')
    await kid.keyboard.press('Escape')
    await kid.goto(`/kid/listen/${bookIds[PLANS[0]!.title]}`)
    await kid.getByRole('button', { name: 'Lire', exact: true }).click()
    await kid.waitForTimeout(900)
    await capture(kid, 'kid-reader')
    await kid.context().close()

    const parent = await signedInPage(browser, origin, PARENT)
    await parent.goto('/library')
    await expect(parent.locator('img.cover__image').first()).toBeVisible()
    await capture(parent, 'library')
    await startBook(parent, 'Le petit phare')
    await toPages(parent)
    await parent.getByTestId('add-photo-input').setInputFiles([
        { name: 'cover.png', mimeType: 'image/png', buffer: newBookCover },
        { name: 'page.png', mimeType: 'image/png', buffer: newBookPage },
    ])
    await expect(parent.getByRole('group', { name: 'Page 2', exact: true })).toBeVisible()
    await capture(parent, 'book-new')
    await parent.goto(`/books/${bookIds['Ours en pyjama']}/review`)
    await capture(parent, 'review')
    await parent.goto('/family')
    await capture(parent, 'family')
    await parent.context().close()

    const relative = await signedInPage(browser, origin, ODILE)
    await relative.goto('/messages')
    await capture(relative, 'messages')
    await relative.goto(`/books/${bookIds['Le jardin de Poppy']}/studio`)
    await relative.getByRole('button', { name: 'Enregistrer', exact: true }).scrollIntoViewIfNeeded()
    await capture(relative, 'studio')
    await relative.context().close()

    const desktop = await signedInPage(browser, origin, PARENT, { width: 1280, height: 800 }, false)
    await desktop.goto('/library')
    await expect(desktop.locator('img.cover__image').first()).toBeVisible()
    await capture(desktop, 'desktop-library')
    await desktop.goto('/family')
    await capture(desktop, 'desktop-family')
    await desktop.getByTestId('settings-open').click()
    await openMenuSection(desktop, 'Thème')
    await desktop.locator('[data-theme-choice="dark"]').click()
    await desktop.getByTestId('settings-close').click()
    await desktop.goto('/library')
    await expect(desktop.locator('img.cover__image').first()).toBeVisible()
    await capture(desktop, 'library-dark')
    await desktop.context().close()

    await Promise.all(Object.values(readers).map(reader => reader.dispose()))
    await Promise.all([lola.dispose(), noe.dispose()])
})
