import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { apiJson, chooseProfile, finishPages, login, nextPage, sendBook, toPages, pngFile, startBook, PARENT_NAME } from './helpers'
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
        await page.getByTestId('page-photo').click()
        await page.getByTestId('page-add-image').click()
        await page.getByTestId('image-input-gallery').setInputFiles(pngFile('only.png'))
        await expect(page.getByText('Photo ajoutée')).toBeVisible()
        await page.getByRole('button', { name: 'Retirer la voix 1' }).click()
        await nextPage(page)
        await page.getByTestId('page-silent-2').click()
        await finishPages(page)
        await sendBook(page)
        const book = await apiJson<IBook>(page, `/books/${page.url().split('/')[4]}`)
        expect(book.pages).toHaveLength(2)
        expect(book.pages.map(item => item.kind)).toEqual(['content', 'empty'])
        expect(book.pages.map(item => item.isSilent)).toEqual([false, true])
        expect(book.lines).toHaveLength(1)
        expect(book.lines[0]!.pageIndex).toBe(0)
    })

    test('a comic panel flagged without words gets no line to record', async ({ page }, info) => {
        await openEditor(page, `Case muette ${info.project.name}`)
        await page.getByRole('button', { name: 'Bande dessinée', exact: true }).click()
        await toPages(page)
        await page.getByTestId('page-photo').click()
        await page.getByTestId('page-add-image').click()
        await page.getByTestId('image-input-gallery').setInputFiles(pngFile('bd.png'))
        await expect(page.getByText('Photo ajoutée')).toBeVisible()
        await page.getByTestId('panel-add').click()
        await page.getByTestId('panel-add').click()
        await page.getByRole('checkbox', { name: 'Case sans paroles (image seule)' }).last().check()
        await page.getByRole('button', { name: 'Retirer la voix 1' }).click()
        await finishPages(page)
        await sendBook(page)
        const book = await apiJson<IBook>(page, `/books/${page.url().split('/')[4]}`)
        expect(book.pages[0]!.panels).toHaveLength(2)
        expect(book.lines).toHaveLength(1)
        expect(book.lines[0]!.panelId).toBe(book.pages[0]!.panels[0]!.id)
    })

    test('an unfinished book is kept as a draft and can be resumed', async ({ page }, info) => {
        const title = `Brouillon ${info.project.name}`
        await openEditor(page, title)
        await toPages(page)
        await page.getByTestId('page-silent-1').click()
        await page.getByTestId('save-draft').click()
        await expect(page.getByText('Brouillon enregistré')).toBeVisible()
        await page.goto('/books/new')
        await expect(page.getByText('Un brouillon t’attend')).toBeVisible()
        await page.getByTestId('resume-draft').click()
        await expect(page.getByRole('heading', { name: 'Les pages' })).toBeVisible()
        await expect(page.getByRole('group', { name: 'Page 1', exact: true })).toBeVisible()
        await page.getByTestId('page-back').click()
        await expect(page.getByLabel('Titre du livre')).toHaveValue(title)
    })

    test('discarding the draft starts from an empty book', async ({ page }, info) => {
        await openEditor(page, `Jeté ${info.project.name}`)
        await toPages(page)
        await page.getByTestId('page-silent-1').click()
        await page.getByTestId('save-draft').click()
        await page.goto('/books/new')
        await page.getByTestId('discard-draft').click()
        await expect(page.getByLabel('Titre du livre')).toHaveValue('')
    })
})
