import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { addLine, apiJson, chooseProfile, linesCard, login, nextStep, pngFile, startBook, uploadWav, PARENT_NAME } from './helpers'
import type { IBook } from '../../shared/types/book'

const openEditor = async (page: Page, title: string): Promise<void> => {
    await login(page)
    await chooseProfile(page, PARENT_NAME)
    await startBook(page, title)
}

const saveBook = async (page: Page): Promise<IBook> => {
    await expect(page.getByRole('heading', { name: 'Vérifier' })).toBeVisible()
    await page.getByRole('button', { name: 'Passer au studio' }).click()
    await expect(page).toHaveURL(/\/books\/.+\/studio/)
    return apiJson<IBook>(page, `/books/${page.url().split('/')[4]}`)
}

const addCharacter = async (page: Page, name: string): Promise<void> => {
    await page.getByLabel('Nouveau personnage').fill(name)
    await page.getByRole('button', { name: 'Ajouter un personnage' }).click()
    await expect(page.getByRole('group', { name: `Personnage ${name}` })).toBeVisible()
}

const addCharacterOnLines = async (page: Page, name: string): Promise<void> => {
    const card = linesCard(page, 1)
    await card.getByRole('button', { name: '+ Nouveau' }).click()
    await card.getByLabel('Nom du nouveau personnage').fill(name)
    await card.getByRole('button', { name: 'Créer' }).click()
    await expect(card.getByText(`Qui lit la voix de ${name} ?`)).toBeVisible()
    await card.locator('.picker', { hasText: PARENT_NAME }).click()
    await expect(card.getByRole('button', { name, exact: true })).toHaveAttribute('aria-pressed', 'true')
}

const reachLinesWithoutPhoto = async (page: Page): Promise<void> => {
    await nextStep(page)
    await page.getByRole('button', { name: 'Continuer sans photo' }).click()
    await nextStep(page)
    await expect(page.getByRole('heading', { name: 'Les répliques' })).toBeVisible()
}

test.describe('book editor', () => {
    test('a character is defined once and reused on several pages with a narrator', async ({ page }, info) => {
        await openEditor(page, `Personnages ${info.project.name}`)
        await nextStep(page)
        await page.locator('input[type=file]').setInputFiles([pngFile('a.png'), pngFile('b.png')])
        await expect(page.locator('.thumb')).toHaveCount(2)
        await nextStep(page)

        await expect(page.getByRole('group', { name: 'Personnage Narrateur' }).getByRole('button', { name: 'Narrateur', exact: true })).toHaveAttribute('aria-pressed', 'true')
        await addCharacter(page, 'Petit Zébu')
        const zebuCard = page.getByRole('group', { name: 'Personnage Petit Zébu' })
        await zebuCard.getByLabel('Description (facultatif)').fill('Un zébu curieux')
        await zebuCard.getByRole('button', { name: 'Couleur menthe' }).click()
        await zebuCard.locator('.picker', { hasText: PARENT_NAME }).click()
        await nextStep(page)

        await expect(linesCard(page, 1).getByPlaceholder(/Qui parle/)).toHaveCount(0)
        await addLine(page, 1, 'Petit Zébu', 'Bonjour le lac !')
        await addLine(page, 2, 'Petit Zébu', 'Au revoir le lac !')
        await addLine(page, 2, 'Narrateur', 'Le soleil se couchait.')
        await nextStep(page)

        const book = await saveBook(page)
        const zebu = book.characters.find(character => character.name === 'Petit Zébu')!
        expect(book.characters).toHaveLength(2)
        expect(zebu.color).toBe('mint')
        expect(zebu.description).toBe('Un zébu curieux')
        expect(book.characters.find(character => character.isNarrator)?.name).toBe('Narrateur')
        const zebuLines = book.lines.filter(line => line.characterId === zebu.id)
        expect(zebuLines.map(line => line.pageIndex)).toEqual([0, 1])
    })

    test('a character can be created from the lines step and gets a voice there', async ({ page }, info) => {
        await openEditor(page, `Inline ${info.project.name}`)
        await reachLinesWithoutPhoto(page)
        await addCharacterOnLines(page, 'Tantine')
        await addLine(page, 1, null, 'Bonsoir tout le monde.')
        await expect(linesCard(page, 1).locator('.label', { hasText: 'Tantine' })).toBeVisible()
        await nextStep(page)
        const book = await saveBook(page)
        expect(book.characters.map(character => character.name)).toEqual(['Narrateur', 'Tantine'])
        expect(book.lines[0]!.character).toBe('Tantine')
    })

    test('switching between one voice and several voices keeps every line', async ({ page }, info) => {
        await openEditor(page, `Bascule ${info.project.name}`)
        await reachLinesWithoutPhoto(page)
        await addCharacterOnLines(page, 'Petit Zébu')
        await addLine(page, 1, null, 'Première phrase.')
        await addLine(page, 1, 'Narrateur', 'Deuxième phrase.')
        await expect(page.getByText('4/5')).toBeVisible()

        await page.getByRole('button', { name: 'Une seule voix' }).click()
        await expect(page.getByText('3/4')).toBeVisible()
        await expect(linesCard(page, 1).getByText('Première phrase.')).toBeVisible()
        await expect(linesCard(page, 1).getByText('Deuxième phrase.')).toBeVisible()
        await expect(linesCard(page, 1).getByText('Qui parle ?')).toHaveCount(0)

        await page.getByRole('button', { name: 'Plusieurs voix' }).click()
        await expect(linesCard(page, 1).getByText('Qui parle ?')).toBeVisible()
        await expect(linesCard(page, 1).locator('.label', { hasText: 'Petit Zébu' })).toBeVisible()
        await page.getByRole('button', { name: 'Retour' }).click()
        await expect(page.getByRole('group', { name: 'Personnage Petit Zébu' })).toBeVisible()
        await nextStep(page)

        await page.getByRole('button', { name: 'Une seule voix' }).click()
        await nextStep(page)
        await expect(page.getByText(`${PARENT_NAME} lit tout le livre`)).toBeVisible()
        const book = await saveBook(page)
        expect(book.kind).toBe('solo')
        expect(book.lines).toHaveLength(2)
        expect(book.lines.every(line => line.memberId !== null)).toBeTruthy()
    })

    test('a comic book keeps its panels in order with their lines', async ({ page }, info) => {
        await openEditor(page, `BD ${info.project.name}`)
        await page.getByRole('button', { name: 'Bande dessinée', exact: true }).click()
        await nextStep(page)
        await expect(page.getByRole('button', { name: 'Suivant', exact: true })).toBeDisabled()
        await page.locator('input[type=file]').setInputFiles(pngFile('bd.png'))
        await expect(page.locator('.thumb')).toHaveCount(1)
        const pageCard = page.getByRole('group', { name: 'Page 1' })
        await pageCard.getByRole('button', { name: 'Ajouter une case' }).click()
        await pageCard.getByRole('button', { name: 'Ajouter une case' }).click()
        await pageCard.getByLabel('Case 1', { exact: true }).fill('Le zébu court')
        await pageCard.getByLabel('Case 2', { exact: true }).fill('Le zébu tombe')
        await nextStep(page)
        await nextStep(page)

        const card = linesCard(page, 1)
        const panelChips = card.getByRole('group', { name: 'Case', exact: true })
        await panelChips.getByRole('button', { name: 'Case 2', exact: true }).click()
        await addLine(page, 1, 'Narrateur', 'Patatras !')
        await panelChips.getByRole('button', { name: 'Case 1', exact: true }).click()
        await addLine(page, 1, 'Narrateur', 'Il court vite.')
        await nextStep(page)

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
        await expect(page.getByRole('button', { name: 'Une seule voix' })).toHaveCount(0)
        await nextStep(page)
        await expect(page.getByText('2/3')).toBeVisible()
        await expect(page.getByRole('button', { name: 'Suivant', exact: true })).toBeDisabled()
        await page.locator('input[type=file]').setInputFiles([pngFile('w1.png'), pngFile('w2.png')])
        await expect(page.locator('.thumb')).toHaveCount(2)
        await nextStep(page)
        const book = await saveBook(page)
        expect(book.type).toBe('wordless')
        expect(book.lines).toHaveLength(0)
        expect(book.pages).toHaveLength(2)
    })

    test('an empty page is skippable and flagged for the synthetic voice', async ({ page }, info) => {
        await openEditor(page, `Page vide ${info.project.name}`)
        await nextStep(page)
        await page.locator('input[type=file]').setInputFiles(pngFile('c.png'))
        await expect(page.locator('.thumb')).toHaveCount(1)
        await page.getByRole('button', { name: 'Ajouter une page vide' }).click()
        const empty = page.getByRole('group', { name: 'Page 2' })
        await expect(empty.getByText('Page vide', { exact: true })).toBeVisible()
        await expect(empty.getByLabel('Voix de synthèse si personne ne la lit')).toBeChecked()
        await page.getByRole('group', { name: 'Page 1' }).getByRole('button', { name: 'Couverture', exact: true }).click()
        await nextStep(page)
        await nextStep(page)
        await expect(linesCard(page, 2).getByText('Page vide : rien à enregistrer')).toBeVisible()
        await expect(linesCard(page, 2).getByLabel('Texte', { exact: true })).toHaveCount(0)
        await addLine(page, 1, 'Narrateur', 'Une couverture qui parle.')
        await nextStep(page)
        const book = await saveBook(page)
        expect(book.pages.map(item => item.kind)).toEqual(['cover', 'empty'])
        expect(book.pages[1]!.fileId).toBeNull()
        expect(book.pages[1]!.ttsFallback).toBe(true)
    })

    test('tone chips apply in one tap and a free tone is possible', async ({ page }, info) => {
        await openEditor(page, `Tons ${info.project.name}`)
        await reachLinesWithoutPhoto(page)
        const card = linesCard(page, 1)
        await card.getByRole('button', { name: 'Triste', exact: true }).click()
        await expect(card.getByRole('button', { name: 'Triste', exact: true })).toHaveAttribute('aria-pressed', 'true')
        await addLine(page, 1, 'Narrateur', 'Le zébu a perdu son chapeau.')
        await expect(card.getByRole('button', { name: 'Triste', exact: true })).toHaveAttribute('aria-pressed', 'false')
        await card.getByRole('button', { name: 'Autre…' }).click()
        await card.getByLabel('Ton libre').fill('Solennel')
        await addLine(page, 1, 'Narrateur', 'Il fit un grand discours.')
        await card.getByRole('button', { name: 'Ton : Triste', exact: true }).click()
        const row = card.locator('.line', { hasText: 'Le zébu a perdu son chapeau.' })
        await row.getByRole('button', { name: 'En riant', exact: true }).click()
        await expect(card.getByRole('button', { name: 'Ton : En riant', exact: true })).toBeVisible()
        await nextStep(page)
        const book = await saveBook(page)
        expect(book.lines.map(line => line.tone)).toEqual(['En riant', 'Solennel'])
    })

    test('a pasted text is split into lines and the language can be Malagasy', async ({ page }, info) => {
        await openEditor(page, `Malagasy ${info.project.name}`)
        const languages = await page.getByLabel('Langue du livre').locator('option').allTextContents()
        expect(languages).toHaveLength(9)
        expect(languages.join(' ')).toContain('🇲🇬 Malgache')
        await page.getByLabel('Langue du livre').selectOption('mg')
        await page.getByText('Plus de détails (facultatif)').click()
        await page.getByLabel('Sous-titre').fill('Tantara kely')
        await page.getByLabel('Auteur', { exact: true }).fill('Rakoto')
        await page.getByLabel('Âge minimum').fill('3')
        await page.getByLabel('Âge maximum').fill('6')
        await nextStep(page)
        await page.getByRole('button', { name: 'Continuer sans photo' }).click()
        await nextStep(page)
        await addCharacterOnLines(page, 'Rabe')
        const card = linesCard(page, 1)
        await card.getByRole('button', { name: 'Narrateur', exact: true }).click()
        await card.getByLabel('Texte', { exact: true }).fill('Salama daholo !\nRabe : Inona vaovao ?\nAzoko tsara.')
        await expect(card.getByText('3 répliques seront ajoutées.')).toBeVisible()
        await card.getByRole('button', { name: 'Ajouter', exact: true }).click()
        await expect(card.locator('.line')).toHaveCount(3)
        await nextStep(page)
        const book = await saveBook(page)
        expect(book.language).toBe('mg')
        expect(book.subtitle).toBe('Tantara kely')
        expect(book.author).toBe('Rakoto')
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
