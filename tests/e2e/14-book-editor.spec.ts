import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { addVoice, apiJson, chooseProfile, fillVoice, finishPages, login, newVoice, nextPage, sendBook, toPages, pngFile, startBook, uploadWav, voiceCard, PARENT_NAME, allowSpokenLanguages } from './helpers'
import type { IBook } from '../../shared/types/book'

const openEditor = async (page: Page, title: string): Promise<void> => {
    await login(page)
    await chooseProfile(page, PARENT_NAME)
    await startBook(page, title)
}

const saveBook = async (page: Page): Promise<IBook> => {
    await expect(page.getByTestId('send-step')).toBeVisible()
    const id = await sendBook(page)
    return apiJson<IBook>(page, `/books/${id}`)
}

const openDetails = async (page: Page): Promise<void> => {
    await page.getByTestId('book-details-toggle').click()
}

const addPhotoToPage = async (page: Page, name: string): Promise<void> => {
    await page.getByTestId('page-photo').click()
    await page.getByTestId('page-add-image').click()
    await page.getByTestId('image-input-gallery').setInputFiles(pngFile(name))
    await expect(page.getByText('Photo ajoutée')).toBeVisible()
}

test.describe('book editor', () => {
    test('a character is defined once and reused on several pages with a narrator', async ({ page }, info) => {
        await openEditor(page, `Personnages ${info.project.name}`)
        await toPages(page)
        const first = voiceCard(page, 1)
        await first.getByTestId('voice-new').click()
        await first.getByTestId('voice-new-name').fill('Petit Zébu')
        await first.getByRole('button', { name: 'Couleur menthe' }).click()
        await first.getByTestId('voice-create').click()
        await fillVoice(page, 1, 'Bonjour le lac !')
        await nextPage(page)
        await fillVoice(page, 1, 'Au revoir le lac !')
        await addVoice(page)
        await voiceCard(page, 2).getByRole('button', { name: 'Narrateur', exact: true }).click()
        await fillVoice(page, 2, 'Le soleil se couchait.')
        await finishPages(page)

        const book = await saveBook(page)
        const zebu = book.characters.find(character => character.name === 'Petit Zébu')!
        expect(book.characters).toHaveLength(2)
        expect(zebu.color).toBe('mint')
        expect(book.characters.find(character => character.isNarrator)?.name).toBe('Narrateur')
        const zebuLines = book.lines.filter(line => line.characterId === zebu.id)
        expect(zebuLines.map(line => line.pageIndex)).toEqual([0, 1])
    })

    test('a character can be created from the page step and gets a voice there', async ({ page }, info) => {
        await openEditor(page, `Inline ${info.project.name}`)
        await toPages(page)
        await newVoice(page, 1, 'Tantine')
        await expect(voiceCard(page, 1).getByTestId('reader-relative')).toHaveAttribute('aria-pressed', 'true')
        await fillVoice(page, 1, 'Bonsoir tout le monde.')
        await finishPages(page)
        const book = await saveBook(page)
        expect(book.characters.map(character => character.name)).toEqual(['Tantine'])
        expect(book.lines[0]!.character).toBe('Tantine')
        expect(book.lines[0]!.memberId).not.toBeNull()
    })

    test('switching between one voice and several voices keeps every line', async ({ page }, info) => {
        await openEditor(page, `Bascule ${info.project.name}`)
        await toPages(page)
        await newVoice(page, 1, 'Petit Zébu')
        await fillVoice(page, 1, 'Première phrase.')
        await addVoice(page)
        await voiceCard(page, 2).getByRole('button', { name: 'Narrateur', exact: true }).click()
        await fillVoice(page, 2, 'Deuxième phrase.')

        await page.getByTestId('page-back').click()
        await openDetails(page)
        await page.getByTestId('single-voice').click()
        await toPages(page)
        await expect(voiceCard(page, 1).getByLabel('Texte', { exact: true })).toHaveValue('Première phrase.')
        await expect(voiceCard(page, 2).getByLabel('Texte', { exact: true })).toHaveValue('Deuxième phrase.')
        await expect(page.getByText('Qui la lit ?')).toHaveCount(0)

        await page.getByTestId('page-back').click()
        await openDetails(page)
        await page.getByTestId('single-voice').click()
        await toPages(page)
        await expect(voiceCard(page, 1).getByRole('button', { name: 'Petit Zébu', exact: true })).toBeVisible()
        await expect(page.getByText('Qui la lit ?').first()).toBeVisible()

        await page.getByTestId('page-back').click()
        await openDetails(page)
        await page.getByTestId('single-voice').click()
        await toPages(page)
        await finishPages(page)
        await expect(page.getByText(`${PARENT_NAME} lit tout le livre`)).toBeVisible()
        const book = await saveBook(page)
        expect(book.kind).toBe('solo')
        expect(book.lines).toHaveLength(2)
        expect(book.lines.every(line => line.memberId !== null)).toBeTruthy()
    })

    test('a comic book keeps its panels in order with their lines', async ({ page }, info) => {
        await openEditor(page, `BD ${info.project.name}`)
        await page.getByRole('button', { name: 'Bande dessinée', exact: true }).click()
        await toPages(page)
        await addPhotoToPage(page, 'bd.png')
        await page.getByTestId('panel-add').click()
        await page.getByTestId('panel-add').click()
        await page.getByLabel('Case 1', { exact: true }).fill('Le zébu court')
        await page.getByLabel('Case 2', { exact: true }).fill('Le zébu tombe')
        await voiceCard(page, 1).getByRole('button', { name: 'Case 2', exact: true }).click()
        await fillVoice(page, 1, 'Patatras !')
        await addVoice(page)
        await voiceCard(page, 2).getByRole('button', { name: 'Case 1', exact: true }).click()
        await fillVoice(page, 2, 'Il court vite.')
        await finishPages(page)

        const book = await saveBook(page)
        expect(book.type).toBe('comic')
        const panels = book.pages[0]!.panels
        expect(panels.map(panel => panel.description)).toEqual(['Le zébu court', 'Le zébu tombe'])
        expect(book.lines.map(line => line.text)).toEqual(['Il court vite.', 'Patatras !'])
        expect(book.lines.map(line => line.panelId)).toEqual(panels.map(panel => panel.id))
    })

    test('a wordless book only needs images', async ({ page }, info) => {
        await openEditor(page, `Sans texte ${info.project.name}`)
        await page.getByRole('button', { name: 'Sans texte', exact: true }).click()
        await toPages(page)
        await expect(page.getByTestId('voice-add')).toHaveCount(0)
        await addPhotoToPage(page, 'w1.png')
        await nextPage(page)
        await addPhotoToPage(page, 'w2.png')
        await finishPages(page)
        const book = await saveBook(page)
        expect(book.type).toBe('wordless')
        expect(book.lines).toHaveLength(0)
        expect(book.pages).toHaveLength(2)
    })

    test('a blank silent page is allowed after a photo cover and a page with a voice', async ({ page }, info) => {
        await openEditor(page, `Page vide ${info.project.name}`)
        await page.getByTestId('cover-photo').click()
        await page.getByTestId('cover-add-image').click()
        await page.getByTestId('image-input-gallery').setInputFiles(pngFile('c.png'))
        await expect(page.getByText('Photo ajoutée')).toBeVisible()
        await toPages(page)
        await fillVoice(page, 1, 'Une page qui parle.')
        await nextPage(page)
        await page.getByTestId('page-silent-2').click()
        await expect(page.getByText('Page muette', { exact: false })).toBeVisible()
        await finishPages(page)
        const book = await saveBook(page)
        expect(book.pages.map(item => item.kind)).toEqual(['cover', 'content', 'empty'])
        expect(book.pages[2]!.fileId).toBeNull()
        expect(book.pages[2]!.isSilent).toBe(true)
    })

    test('a voice can carry a free tone for the reader', async ({ page }, info) => {
        await openEditor(page, `Tons ${info.project.name}`)
        await toPages(page)
        await fillVoice(page, 1, 'Le zébu a perdu son chapeau.')
        await voiceCard(page, 1).getByLabel('Description', { exact: false }).fill('En riant')
        await addVoice(page)
        await fillVoice(page, 2, 'Il fit un grand discours.')
        await voiceCard(page, 2).getByLabel('Description', { exact: false }).fill('Solennel')
        await finishPages(page)
        const book = await saveBook(page)
        expect(book.lines.map(line => line.tone)).toEqual(['En riant', 'Solennel'])
    })

    test('the book language can be Malagasy and the details are kept', async ({ page }, info) => {
        await openEditor(page, `Malagasy ${info.project.name}`)
        await allowSpokenLanguages(page.request, ['fr', 'mg'])
        await openDetails(page)
        await page.getByLabel('Langue du livre', { exact: true }).click()
        const languages = await page.getByRole('option').allTextContents()
        expect(languages).toHaveLength(9)
        expect(languages.join(' ')).toContain('🇲🇬 Malagasy')
        await page.getByRole('option', { name: /Malagasy/ }).click()
        await page.getByLabel('Sous-titre').fill('Tantara kely')
        await page.getByLabel('Auteur', { exact: true }).fill('Rakoto')
        await page.getByLabel('Dessinateur', { exact: true }).fill('Soa')
        await page.getByLabel('Âge minimum').fill('3')
        await page.getByLabel('Âge maximum').fill('6')
        await toPages(page)
        await fillVoice(page, 1, 'Salama daholo !')
        await addVoice(page)
        await newVoice(page, 2, 'Rabe')
        await fillVoice(page, 2, 'Inona vaovao ?')
        await addVoice(page)
        await voiceCard(page, 3).getByRole('button', { name: 'Narrateur', exact: true }).click()
        await fillVoice(page, 3, 'Azoko tsara.')
        await finishPages(page)
        const book = await saveBook(page)
        expect(book.language).toBe('mg')
        expect(book.subtitle).toBe('Tantara kely')
        expect(book.author).toBe('Rakoto')
        expect(book.illustrator).toBe('Soa')
        expect([book.ageMin, book.ageMax]).toEqual([3, 6])
        expect(book.lines.map(line => line.character)).toEqual(['Narrateur', 'Rabe', 'Narrateur'])
    })
})

test.describe('panel cue', () => {
    const installOscillatorSpy = async (page: Page): Promise<void> => {
        await page.addInitScript(() => {
            const played: number[] = []
            const original = OscillatorNode.prototype.start
            OscillatorNode.prototype.start = function (this: OscillatorNode, when?: number): void {
                played.push(this.frequency.value)
                original.call(this, when)
            }
            ;(window as unknown as { __played: number[] }).__played = played
        })
    }

    const playedTones = (page: Page): Promise<number[]> => page.evaluate(() => (window as unknown as { __played: number[] }).__played)

    const createPanelBook = async (page: Page, title: string): Promise<string> => {
        const png = pngFile('cue.png')
        const upload = await page.request.post('/api/files', { data: png.buffer, headers: { 'content-type': png.mimeType } })
        const { id: imageId } = (await upload.json()) as { id: string }
        const members = await apiJson<{ id: string; name: string }[]>(page, '/members')
        const parent = members.find(member => member.name === PARENT_NAME)!
        const created = await page.request.post('/api/books', {
            data: {
                title,
                type: 'comic',
                kind: 'solo',
                soloMemberId: parent.id,
                imageDesc: '',
                pageFileIds: [],
                pages: [
                    { fileId: imageId, panels: [{ description: 'a' }, { description: 'b' }] },
                    { fileId: imageId, panels: [{ description: 'c' }] },
                ],
                lines: [
                    { pageIndex: 0, character: '', text: 'Un', panelPosition: 0 },
                    { pageIndex: 0, character: '', text: 'Deux', panelPosition: 1 },
                    { pageIndex: 1, character: '', text: 'Trois', panelPosition: 0 },
                ],
            },
        })
        const { id } = (await created.json()) as { id: string }
        const book = await apiJson<IBook>(page, `/books/${id}`)
        for (const line of book.lines) {
            const fileId = await uploadWav(page, 600)
            const response = await page.request.put(`/api/books/${id}/lines/${line.id}/audio`, { data: { fileId, ms: 600 } })
            expect(response.ok()).toBeTruthy()
        }
        await page.request.patch(`/api/books/${id}`, { data: { status: 'ready' } })
        return id
    }

    test('plays a soft cue between panels and keeps the ding for page turns', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const id = await createPanelBook(page, `Cases ${info.project.name}`)
        await installOscillatorSpy(page)
        await page.goto(`/kid/listen/${id}`)
        await page.getByRole('button', { name: 'Lire' }).click()
        await expect(page.getByRole('button', { name: 'Tourner la page' })).toBeVisible({ timeout: 20000 })
        expect(await playedTones(page)).toEqual([988, 1318.5, 1760])
    })

    test('stays silent when the sound is switched off', async ({ page }, info) => {
        await login(page)
        await chooseProfile(page, PARENT_NAME)
        const id = await createPanelBook(page, `Silence ${info.project.name}`)
        await installOscillatorSpy(page)
        await page.goto(`/kid/listen/${id}`)
        await page.getByRole('button', { name: 'Son', exact: true }).click()
        await expect(page.getByRole('button', { name: 'Sans son', exact: true })).toHaveAttribute('aria-pressed', 'false')
        await page.getByRole('button', { name: 'Lire' }).click()
        await expect(page.getByRole('button', { name: 'Tourner la page' })).toBeVisible({ timeout: 20000 })
        expect(await playedTones(page)).toEqual([])
    })
})
