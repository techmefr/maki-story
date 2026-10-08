import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { apiJson, chooseProfile, finishPages, login, toPages, pngFile, startBook, PARENT_NAME } from './helpers'
import type { IBook } from '../../shared/types/book'

const openEditor = async (page: Page, title: string): Promise<void> => {
    await login(page)
    await chooseProfile(page, PARENT_NAME)
    await startBook(page, title)
}

test.describe('book creation by pages', () => {
    test('a book made of pages only is saved with a line of reference to record', async ({ page }, info) => {
        await openEditor(page, `Pages seules ${info.project.name}`)
        await toPages(page)
        await page.getByTestId('add-photo-input').setInputFiles(pngFile('only.png'))
        await expect(page.locator('.thumb')).toHaveCount(1)
        await page.getByTestId('add-silent-page').click()
        await finishPages(page)
        await page.getByRole('button', { name: 'Passer au studio' }).click()
        await expect(page).toHaveURL(/\/books\/.+\/studio/)
        const book = await apiJson<IBook>(page, `/books/${page.url().split('/')[4]}`)
        expect(book.pages).toHaveLength(2)
        expect(book.pages.map(item => item.kind)).toEqual(['content', 'empty'])
        expect(book.lines).toHaveLength(1)
        expect(book.lines[0]!.pageIndex).toBe(0)
    })

    test('a comic panel flagged without words gets no line to record', async ({ page }, info) => {
        await openEditor(page, `Case muette ${info.project.name}`)
        await page.getByRole('button', { name: 'Bande dessinée', exact: true }).click()
        await toPages(page)
        await page.getByTestId('add-photo-input').setInputFiles(pngFile('bd.png'))
        const pageCard = page.getByRole('group', { name: 'Page 1', exact: true })
        await pageCard.getByRole('button', { name: 'Ajouter une case' }).click()
        await pageCard.getByRole('button', { name: 'Ajouter une case' }).click()
        await pageCard.getByRole('checkbox', { name: 'Case sans paroles (image seule)' }).last().check()
        await finishPages(page)
        await page.getByRole('button', { name: 'Passer au studio' }).click()
        await expect(page).toHaveURL(/\/books\/.+\/studio/)
        const book = await apiJson<IBook>(page, `/books/${page.url().split('/')[4]}`)
        expect(book.pages[0]!.panels).toHaveLength(2)
        expect(book.lines).toHaveLength(1)
        expect(book.lines[0]!.panelId).toBe(book.pages[0]!.panels[0]!.id)
    })

    test('an unfinished book is kept as a draft and can be resumed', async ({ page }, info) => {
        const title = `Brouillon ${info.project.name}`
        await openEditor(page, title)
        await toPages(page)
        await page.getByTestId('add-silent-page').click()
        await page.getByTestId('save-draft').click()
        await expect(page.getByText('Brouillon enregistré sur cet appareil.')).toBeVisible()
        await page.goto('/books/new')
        await expect(page.getByText('Un brouillon t’attend')).toBeVisible()
        await page.getByTestId('resume-draft').click()
        await expect(page.getByRole('heading', { name: 'Les pages' })).toBeVisible()
        await expect(page.getByRole('group', { name: 'Page 1', exact: true })).toBeVisible()
        await page.getByRole('button', { name: 'Retour' }).click()
        await expect(page.getByLabel('Titre du livre')).toHaveValue(title)
    })

    test('discarding the draft starts from an empty book', async ({ page }, info) => {
        await openEditor(page, `Jeté ${info.project.name}`)
        await toPages(page)
        await page.getByTestId('add-silent-page').click()
        await page.getByTestId('save-draft').click()
        await page.goto('/books/new')
        await page.getByTestId('discard-draft').click()
        await expect(page.getByLabel('Titre du livre')).toHaveValue('')
    })
})
