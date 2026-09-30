# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03-book-multi.spec.ts >> multi voice book >> creates a book with photos, two pages and cast voices
- Location: tests/e2e/03-book-multi.spec.ts:29:5

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('.card').filter({ has: locator('.subtitle').filter({ hasText: 'Petit Zébu' }) }).filter({ has: locator('.picker') }).locator('.picker').filter({ hasText: 'Lova-desktop' })

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - status [ref=f1e4]: Tantara
  - generic [ref=f1e6]:
    - banner [ref=f1e7]:
      - link "Tantara" [ref=f1e8] [cursor=pointer]:
        - /url: /home
      - navigation [ref=f1e32]:
        - link "Bibliothèque" [ref=f1e33] [cursor=pointer]:
          - /url: /home
        - link "Messages" [ref=f1e34] [cursor=pointer]:
          - /url: /messages
        - link "Famille" [ref=f1e35] [cursor=pointer]:
          - /url: /family
      - generic [ref=f1e36]:
        - button "Avis" [ref=f1e38] [cursor=pointer]
        - button "Changer de profil" [ref=f1e39] [cursor=pointer]:
          - generic [ref=f1e40]: P
    - generic [ref=f1e41]:
      - link "Annuler" [ref=f1e42] [cursor=pointer]:
        - /url: /home
      - generic [ref=f1e43]:
        - heading "Colorier les voix" [level=1] [ref=f1e44]
        - generic [ref=f1e45]: 3/4
      - generic [ref=f1e46]:
        - generic [ref=f1e47]:
          - generic [ref=f1e48]: Décris l’image de la page (facultatif)
          - textbox "Décris l’image de la page (facultatif)" [ref=f1e49]:
            - /placeholder: Un petit zébu au bord d’un lac…
            - text: Un zébu près du lac Itasy
        - generic [ref=f1e50]:
          - button "Par personnage" [ref=f1e51] [cursor=pointer]
          - button "Par réplique" [ref=f1e52] [cursor=pointer]
        - generic [ref=f1e53]: 1/3 personnages ont une voix.
        - generic [ref=f1e54]:
          - generic [ref=f1e55]: Narrateur
          - button "P Parent" [active] [ref=f1e57] [cursor=pointer]:
            - generic [ref=f1e58]: P
            - generic [ref=f1e59]: Parent
        - generic [ref=f1e60]:
          - generic [ref=f1e61]: Maman Zébu
          - button "P Parent" [ref=f1e63] [cursor=pointer]:
            - generic [ref=f1e64]: P
            - generic [ref=f1e65]: Parent
        - generic [ref=f1e66]:
          - generic [ref=f1e67]: Petit Zébu
          - button "P Parent" [ref=f1e69] [cursor=pointer]:
            - generic [ref=f1e70]: P
            - generic [ref=f1e71]: Parent
        - generic [ref=f1e72]:
          - generic [ref=f1e73]: Le ton de chaque voix
          - generic [ref=f1e74]:
            - generic [ref=f1e75]:
              - generic [ref=f1e76]: P
              - generic [ref=f1e77]: Parent
            - textbox "P Parent" [ref=f1e78]:
              - /placeholder: Douce, grave, joyeuse…
        - generic [ref=f1e79]:
          - generic [ref=f1e80]: Une indication par phrase (facultatif)
          - generic [ref=f1e81]:
            - generic [ref=f1e82]: Au bord du lac, le zébu regardait les oiseaux.
            - textbox "Au bord du lac, le zébu regardait les oiseaux." [ref=f1e83]:
              - /placeholder: chuchoté, en riant…
          - generic [ref=f1e84]:
            - generic [ref=f1e85]: Parce que tu as quatre pattes solides.
            - textbox "Parce que tu as quatre pattes solides." [ref=f1e86]:
              - /placeholder: chuchoté, en riant…
          - generic [ref=f1e87]:
            - generic [ref=f1e88]: Et le lémurien bondit de branche en branche.
            - textbox "Et le lémurien bondit de branche en branche." [ref=f1e89]:
              - /placeholder: chuchoté, en riant…
          - generic [ref=f1e90]:
            - generic [ref=f1e91]: Pourquoi je n’ai pas d’ailes ?
            - textbox "Pourquoi je n’ai pas d’ailes ?" [ref=f1e92]:
              - /placeholder: chuchoté, en riant…
        - button "Encore 2 répliques à colorier" [disabled] [ref=f1e93]
      - button "Retour" [ref=f1e94] [cursor=pointer]
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test'
  2   | import type { Page } from '@playwright/test'
  3   | import { addLine, apiJson, chooseProfile, login, pngFile, recordOnce, uniqueName } from './helpers'
  4   | 
  5   | test.describe.configure({ mode: 'serial' })
  6   | 
  7   | const castCharacter = async (page: Page, character: string, member: string): Promise<void> => {
  8   |     const card = page.locator('.card', { has: page.locator('.subtitle', { hasText: character }) }).filter({ has: page.locator('.picker') })
> 9   |     await card.locator('.picker', { hasText: member }).click()
      |                                                        ^ Error: locator.click: Test timeout of 90000ms exceeded.
  10  | }
  11  | 
  12  | const recordMemberLines = async (page: Page, member: string): Promise<void> => {
  13  |     await page.locator('.picker', { hasText: member }).first().click()
  14  |     const rec = page.getByRole('button', { name: 'Enregistrer' })
  15  |     for (let i = 0; i < 5; i++) {
  16  |         const isStillTodo = await page.locator('.picker', { hasText: new RegExp(`${member}.* (\\d+)/(\\d+)`) }).first().innerText()
  17  |         const [, done, total] = isStillTodo.match(/(\d+)\/(\d+)/) ?? []
  18  |         if (done === total) {
  19  |             return
  20  |         }
  21  |         await recordOnce(page, rec)
  22  |         await expect(page.locator('.picker', { hasText: member }).first()).not.toHaveText(new RegExp(`${done}/${total}$`), { timeout: 15000 })
  23  |     }
  24  | }
  25  | 
  26  | test.describe('multi voice book', () => {
  27  |     let bookId = ''
  28  | 
  29  |     test('creates a book with photos, two pages and cast voices', async ({ page }, info) => {
  30  |         const project = info.project.name
  31  |         const mamie = uniqueName('Mamie', project)
  32  |         const lova = uniqueName('Lova', project)
  33  |         await login(page)
  34  |         await chooseProfile(page, 'Parent')
  35  |         await page.getByRole('link', { name: 'Nouveau livre' }).click()
  36  |         await page.getByRole('button', { name: /Plusieurs voix/ }).click()
  37  | 
  38  |         await expect(page.getByRole('heading', { name: 'Scanner les pages' })).toBeVisible()
  39  |         await expect(page.getByText('1/4')).toBeVisible()
  40  |         await page.locator('input[type=file]').setInputFiles([pngFile('p1.png'), pngFile('p2.png')])
  41  |         await expect(page.locator('.thumb')).toHaveCount(2)
  42  |         await page.locator('.thumb__remove').last().click()
  43  |         await expect(page.locator('.thumb')).toHaveCount(1)
  44  |         await page.locator('input[type=file]').setInputFiles(pngFile('p2.png'))
  45  |         await expect(page.locator('.thumb')).toHaveCount(2)
  46  |         await page.getByRole('button', { name: 'Suivant' }).click()
  47  | 
  48  |         await expect(page.getByRole('heading', { name: 'Les répliques' })).toBeVisible()
  49  |         await expect(page.getByRole('button', { name: 'Suivant' })).toBeDisabled()
  50  |         await addLine(page, 1, 'Narrateur', 'Au bord du lac, le zébu regardait les oiseaux.')
  51  |         await addLine(page, 1, 'Petit Zébu', 'Pourquoi je n’ai pas d’ailes ?')
  52  |         await addLine(page, 2, 'Maman Zébu', 'Parce que tu as quatre pattes solides.')
  53  |         await addLine(page, 2, 'Narrateur', 'Et le lémurien bondit de branche en branche.')
  54  |         await page.locator('.card', { has: page.getByText('Page 1', { exact: true }) }).getByRole('button', { name: '×' }).last().click()
  55  |         await addLine(page, 1, 'Petit Zébu', 'Pourquoi je n’ai pas d’ailes ?')
  56  |         await page.getByRole('button', { name: 'Suivant' }).click()
  57  | 
  58  |         await expect(page.getByRole('heading', { name: 'Colorier les voix' })).toBeVisible()
  59  |         await expect(page.getByRole('button', { name: /Encore 4 répliques à colorier/ })).toBeDisabled()
  60  |         await page.getByPlaceholder('Un petit zébu au bord d’un lac…').fill('Un zébu près du lac Itasy')
  61  |         await castCharacter(page, 'Narrateur', 'Parent')
  62  |         await castCharacter(page, 'Petit Zébu', lova)
  63  |         await expect(page.getByRole('button', { name: /Encore 1 répliques à colorier/ })).toBeDisabled()
  64  |         await castCharacter(page, 'Maman Zébu', mamie)
  65  |         await expect(page.getByText('3/3 personnages ont une voix.')).toBeVisible()
  66  |         await page.getByPlaceholder('Douce, grave, joyeuse…').first().fill('Voix douce')
  67  |         await page.getByPlaceholder('chuchoté, en riant…').first().fill('en chuchotant')
  68  |         await page.getByRole('button', { name: 'Suivant' }).click()
  69  | 
  70  |         await expect(page.getByRole('heading', { name: 'Vérifier' })).toBeVisible()
  71  |         await expect(page.getByRole('button', { name: 'Passer au studio' })).toBeDisabled()
  72  |         await page.getByPlaceholder('Le Zébu qui voulait voler').fill(`Le petit zébu ${project}`)
  73  |         await page.getByRole('button', { name: 'Passer au studio' }).click()
  74  |         await expect(page).toHaveURL(/\/books\/.+\/studio/)
  75  |         bookId = page.url().split('/')[4] ?? ''
  76  | 
  77  |         const book = await apiJson<{ lines: { memberId: string | null; note: string }[]; tones: Record<string, string>; imageDesc: string; pages: unknown[]; status: string }>(page, `/books/${bookId}`)
  78  |         expect(book.lines).toHaveLength(4)
  79  |         expect(book.lines.every(line => line.memberId !== null)).toBeTruthy()
  80  |         expect(book.pages).toHaveLength(2)
  81  |         expect(book.imageDesc).toBe('Un zébu près du lac Itasy')
  82  |         expect(Object.values(book.tones)).toContain('Voix douce')
  83  |         expect(book.lines.map(line => line.note)).toContain('en chuchotant')
  84  |         expect(book.status).toBe('to_record')
  85  |     })
  86  | 
  87  |     test('shows the book as to record in the library', async ({ page }, info) => {
  88  |         await login(page)
  89  |         await chooseProfile(page, 'Parent')
  90  |         await expect(page.locator('a.card', { hasText: `Le petit zébu ${info.project.name}` })).toContainText('À enregistrer')
  91  |     })
  92  | 
  93  |     test('records every line in the studio and publishes', async ({ page }, info) => {
  94  |         const project = info.project.name
  95  |         await login(page)
  96  |         await chooseProfile(page, 'Parent')
  97  |         await page.goto(`/books/${bookId}/studio`)
  98  |         await expect(page.getByText('Au bord du lac, le zébu regardait les oiseaux.').first()).toBeVisible()
  99  |         await expect(page.getByRole('button', { name: /Enregistre toutes les répliques/ })).toBeDisabled()
  100 |         await expect(page.getByText('Voix douce').first()).toBeVisible()
  101 |         await recordMemberLines(page, 'Parent')
  102 |         await expect(page.getByRole('button', { name: 'Écouter' })).toBeEnabled()
  103 |         await page.getByRole('button', { name: 'Refaire' }).click()
  104 |         await expect(page.getByRole('button', { name: 'Écouter' })).toBeDisabled()
  105 |         await recordMemberLines(page, 'Parent')
  106 |         await recordMemberLines(page, uniqueName('Lova', project))
  107 |         await recordMemberLines(page, uniqueName('Mamie', project))
  108 |         await expect(page.getByRole('button', { name: 'Publier le livre' })).toBeEnabled()
  109 |         await page.getByRole('button', { name: 'Publier le livre' }).click()
```