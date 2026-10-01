import { expect, test } from '@playwright/test'
import type { APIRequestContext } from '@playwright/test'
import { pngFile, signIn, uniqueAccount, useProfile } from './helpers'
import type { IBook, IBookSummary, ICharacter, IPanel } from '../../shared/types/book'

const createBook = async (api: APIRequestContext, data: Record<string, unknown>): Promise<string> => {
    const response = await api.post('/api/books', { data })
    expect(response.ok()).toBeTruthy()
    return ((await response.json()) as { id: string }).id
}

const loadBook = async (api: APIRequestContext, id: string): Promise<IBook> => {
    const response = await api.get(`/api/books/${id}`)
    expect(response.ok()).toBeTruthy()
    return (await response.json()) as IBook
}

const uploadPage = async (api: APIRequestContext): Promise<string> => {
    const file = pngFile('page.png')
    const response = await api.post('/api/files', { data: file.buffer, headers: { 'content-type': file.mimeType } })
    expect(response.ok()).toBeTruthy()
    return ((await response.json()) as { id: string }).id
}

test.describe('book model v2', () => {
    let api: APIRequestContext

    test.beforeAll(async ({ playwright, baseURL }) => {
        api = await playwright.request.newContext({ baseURL })
        await signIn(api, uniqueAccount('model'))
        await useProfile(api, 'Parent')
    })

    test.afterAll(async () => {
        await api.dispose()
    })

    test('characters are created once from line names and reused by lines', async () => {
        const id = await createBook(api, {
            title: 'Le zébu',
            kind: 'multi',
            imageDesc: '',
            pageFileIds: [],
            lines: [
                { pageIndex: 0, character: 'Narrateur', text: 'Un matin.' },
                { pageIndex: 0, character: 'Petit Zébu', text: 'Bonjour !' },
                { pageIndex: 0, character: 'petit zébu', text: 'Encore moi.' },
                { pageIndex: 1, character: '', text: 'Sans nom.' },
            ],
        })
        const book = await loadBook(api, id)
        expect(book.characters.map(character => character.name)).toEqual(['Narrateur', 'Petit Zébu'])
        expect(book.characters[0]!.isNarrator).toBe(true)
        expect(book.characters[1]!.isNarrator).toBe(false)
        const zebu = book.characters[1]!
        expect(book.lines.filter(line => line.characterId === zebu.id)).toHaveLength(2)
        expect(book.lines.map(line => line.character)).toEqual(['Narrateur', 'Petit Zébu', 'Petit Zébu', ''])
        expect(book.lines[3]!.characterId).toBeNull()
    })

    test('a character can be added, renamed, colored and removed, with one narrator per book', async () => {
        const id = await createBook(api, {
            title: 'Personnages',
            kind: 'multi',
            imageDesc: '',
            pageFileIds: [],
            lines: [{ pageIndex: 0, character: 'Maman', text: 'Salut.' }],
        })
        const created = await api.post(`/api/books/${id}/characters`, {
            data: { name: 'Conteur', color: 'sky', description: 'Voix grave', isNarrator: true },
        })
        expect(created.ok()).toBeTruthy()
        const conteur = (await created.json()) as ICharacter
        expect(conteur).toMatchObject({ name: 'Conteur', color: 'sky', description: 'Voix grave', isNarrator: true })
        const second = await api.post(`/api/books/${id}/characters`, { data: { name: 'Narrateur' } })
        expect(second.status()).toBe(400)
        const duplicate = await api.post(`/api/books/${id}/characters`, { data: { name: 'maman' } })
        expect(duplicate.status()).toBe(400)
        const badColor = await api.post(`/api/books/${id}/characters`, { data: { name: 'Papa', color: 'neon' } })
        expect(badColor.status()).toBe(400)

        const book = await loadBook(api, id)
        const maman = book.characters.find(character => character.name === 'Maman')!
        const renamed = await api.patch(`/api/books/${id}/characters/${maman.id}`, { data: { name: 'Maman Zébu', color: 'coral' } })
        expect(renamed.ok()).toBeTruthy()
        const afterRename = await loadBook(api, id)
        expect(afterRename.lines[0]!.character).toBe('Maman Zébu')
        expect(afterRename.characters.find(character => character.id === maman.id)!.color).toBe('coral')

        expect((await api.delete(`/api/books/${id}/characters/${conteur.id}`)).ok()).toBeTruthy()
        expect((await loadBook(api, id)).characters.map(character => character.name)).toEqual(['Maman Zébu'])
        expect((await api.delete(`/api/books/${id}/characters/${conteur.id}`)).status()).toBe(404)
    })

    test('a line can be assigned to another character with a tone and a scene description', async () => {
        const id = await createBook(api, {
            title: 'Ton',
            kind: 'multi',
            imageDesc: '',
            pageFileIds: [],
            characters: [{ name: 'Loup', color: 'grape' }],
            lines: [{ pageIndex: 0, character: 'Narrateur', text: 'Il était une fois.', tone: 'chuchoté' }],
        })
        const book = await loadBook(api, id)
        expect(book.lines[0]!.tone).toBe('chuchoté')
        const loup = book.characters.find(character => character.name === 'Loup')!
        const patched = await api.patch(`/api/books/${id}`, {
            data: { lines: [{ id: book.lines[0]!.id, characterId: loup.id, tone: 'rieur', sceneDescription: 'Dans la forêt' }] },
        })
        expect(patched.ok()).toBeTruthy()
        const after = (await patched.json()) as IBook
        expect(after.lines[0]).toMatchObject({ character: 'Loup', characterId: loup.id, tone: 'rieur', sceneDescription: 'Dans la forêt' })
        const unknown = await api.patch(`/api/books/${id}`, { data: { lines: [{ id: book.lines[0]!.id, characterId: 'nope' }] } })
        expect(unknown.status()).toBe(400)
    })

    test('comic pages carry panels that lines can reference', async () => {
        const file = await uploadPage(api)
        const id = await createBook(api, {
            title: 'BD',
            kind: 'multi',
            type: 'comic',
            imageDesc: '',
            pageFileIds: [],
            pages: [{ fileId: file, kind: 'content', panels: [{ description: 'Le zébu court' }, { description: 'Le lac' }] }],
            lines: [
                { pageIndex: 0, character: 'Zébu', text: 'Vite !', panelPosition: 0 },
                { pageIndex: 0, character: 'Narrateur', text: 'Le lac brille.', panelPosition: 1 },
            ],
        })
        const book = await loadBook(api, id)
        expect(book.type).toBe('comic')
        const panels = book.pages[0]!.panels
        expect(panels.map(panel => panel.description)).toEqual(['Le zébu court', 'Le lac'])
        expect(book.lines.map(line => line.panelId)).toEqual(panels.map(panel => panel.id))

        const added = await api.post(`/api/books/${id}/pages/${book.pages[0]!.id}/panels`, { data: { description: 'La nuit' } })
        expect(added.ok()).toBeTruthy()
        const night = (await added.json()) as IPanel
        expect(night.position).toBe(2)
        const edited = await api.patch(`/api/books/${id}/panels/${night.id}`, { data: { description: 'La nuit tombe' } })
        expect(((await edited.json()) as IPanel).description).toBe('La nuit tombe')
        expect((await api.delete(`/api/books/${id}/panels/${panels[0]!.id}`)).ok()).toBeTruthy()
        const after = await loadBook(api, id)
        expect(after.pages[0]!.panels).toHaveLength(2)
        expect(after.lines[0]!.panelId).toBeNull()

        const wrongPanel = await api.post('/api/books', {
            data: { title: 'KO', kind: 'multi', imageDesc: '', pageFileIds: [], lines: [{ pageIndex: 0, character: 'A', text: 'x', panelPosition: 3 }] },
        })
        expect(wrongPanel.status()).toBe(400)
    })

    test('pages have a kind, empty pages need no image and carry the tts fallback flag', async () => {
        const file = await uploadPage(api)
        const id = await createBook(api, {
            title: 'Pages',
            kind: 'multi',
            type: 'wordless',
            ttsFallback: true,
            imageDesc: '',
            pageFileIds: [],
            pages: [{ fileId: file, kind: 'cover' }, { fileId: file, kind: 'content' }, { fileId: null, kind: 'empty', ttsFallback: true }],
            lines: [],
        })
        const book = await loadBook(api, id)
        expect(book.ttsFallback).toBe(true)
        expect(book.pages.map(page => page.kind)).toEqual(['cover', 'content', 'empty'])
        expect(book.pages[2]).toMatchObject({ fileId: null, ttsFallback: true })
        const changed = await api.patch(`/api/books/${id}/pages/${book.pages[1]!.id}`, { data: { kind: 'empty', ttsFallback: true } })
        expect(((await changed.json()) as { kind: string }).kind).toBe('empty')
        const invalid = await api.patch(`/api/books/${id}/pages/${book.pages[2]!.id}`, { data: { kind: 'content' } })
        expect(invalid.status()).toBe(400)
        const badKind = await api.post('/api/books', {
            data: { title: 'KO', kind: 'multi', imageDesc: '', pageFileIds: [], pages: [{ fileId: null, kind: 'poster' }], lines: [{ pageIndex: 0, character: '', text: 'x' }] },
        })
        expect(badKind.status()).toBe(400)
        const noLines = await api.post('/api/books', { data: { title: 'KO', kind: 'multi', imageDesc: '', pageFileIds: [], lines: [] } })
        expect(noLines.status()).toBe(400)
    })

    test('subtitle, author, age range, language and type are stored, patched and validated', async () => {
        const id = await createBook(api, {
            title: 'Métadonnées',
            subtitle: 'Un conte',
            author: 'A. Auteur',
            illustrator: 'I. Dessin',
            ageMin: 3,
            ageMax: 6,
            language: 'mg',
            type: 'child-written',
            kind: 'multi',
            imageDesc: '',
            pageFileIds: [],
            lines: [{ pageIndex: 0, character: '', text: 'Texte' }],
        })
        const book = await loadBook(api, id)
        expect(book).toMatchObject({ subtitle: 'Un conte', author: 'A. Auteur', illustrator: 'I. Dessin', ageMin: 3, ageMax: 6, language: 'mg', type: 'child-written' })
        const patched = await api.patch(`/api/books/${id}`, { data: { subtitle: 'Autre', ageMax: 8, type: 'standard' } })
        expect(await patched.json()).toMatchObject({ subtitle: 'Autre', author: 'A. Auteur', illustrator: 'I. Dessin', ageMin: 3, ageMax: 8, type: 'standard' })
        const list = (await (await api.get('/api/books')).json()) as IBookSummary[]
        expect(list.find(item => item.id === id)).toMatchObject({ ageMin: 3, ageMax: 8, language: 'mg' })
        expect((await api.patch(`/api/books/${id}`, { data: { ageMin: 9 } })).status()).toBe(400)
        expect((await api.patch(`/api/books/${id}`, { data: { type: 'novel' } })).status()).toBe(400)
        expect((await api.patch(`/api/books/${id}`, { data: { language: 'français!' } })).status()).toBe(400)
        const defaults = await loadBook(
            api,
            await createBook(api, { title: 'Défauts', kind: 'multi', imageDesc: '', pageFileIds: [], lines: [{ pageIndex: 0, character: '', text: 'x' }] }),
        )
        expect(defaults).toMatchObject({ subtitle: '', author: '', illustrator: '', ageMin: null, ageMax: null, language: 'fr', type: 'standard' })
    })

    test('characters and panels of another family are not reachable', async ({ playwright, baseURL }) => {
        const id = await createBook(api, {
            title: 'Privé',
            kind: 'multi',
            imageDesc: '',
            pageFileIds: [],
            lines: [{ pageIndex: 0, character: 'Secret', text: 'x' }],
        })
        const book = await loadBook(api, id)
        const other = await playwright.request.newContext({ baseURL })
        await signIn(other, uniqueAccount('model-other'))
        await useProfile(other, 'Parent')
        expect((await other.post(`/api/books/${id}/characters`, { data: { name: 'Intrus' } })).status()).toBe(404)
        expect((await other.patch(`/api/books/${id}/characters/${book.characters[0]!.id}`, { data: { name: 'X' } })).status()).toBe(404)
        expect((await other.delete(`/api/books/${id}/characters/${book.characters[0]!.id}`)).status()).toBe(404)
        await other.dispose()
        expect((await loadBook(api, id)).characters[0]!.name).toBe('Secret')
    })
})
