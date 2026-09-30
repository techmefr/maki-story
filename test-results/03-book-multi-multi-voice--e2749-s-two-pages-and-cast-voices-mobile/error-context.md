# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 03-book-multi.spec.ts >> multi voice book >> creates a book with photos, two pages and cast voices
- Location: tests/e2e/03-book-multi.spec.ts:29:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Les répliques')
Expected: visible
Error: strict mode violation: getByText('Les répliques') resolved to 2 elements:
    1) <h1 class="title">Les répliques</h1> aka getByRole('heading', { name: 'Les répliques' })
    2) <p class="muted"> Recopie les répliques, page par page. Le texte s…</p> aka getByText('Recopie les répliques, page')

Call log:
  - Expect "toBeVisible" getByText('Les répliques') with timeout 10000ms
  - waiting for getByText('Les répliques')

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - status [ref=f1e4]: Tantara
  - generic [ref=f1e5]:
    - generic [ref=f1e6]:
      - banner [ref=f1e7]:
        - link "Tantara" [ref=f1e8] [cursor=pointer]:
          - /url: /home
        - generic [ref=f1e32]:
          - button "Avis" [ref=f1e34] [cursor=pointer]
          - button "Changer de profil" [ref=f1e35] [cursor=pointer]:
            - generic [ref=f1e36]: P
      - generic [ref=f1e37]:
        - link "Annuler" [ref=f1e38] [cursor=pointer]:
          - /url: /home
        - generic [ref=f1e39]:
          - heading "Les répliques" [level=1] [ref=f1e40]
          - generic [ref=f1e41]: 2/4
        - generic [ref=f1e42]:
          - paragraph [ref=f1e43]: "Recopie les répliques, page par page. Le texte sert seulement à découper : l’enfant ne le verra jamais."
          - generic [ref=f1e44]:
            - generic [ref=f1e45]:
              - generic [ref=f1e46]: Page 1
              - generic [ref=f1e47]: 0 répliques
            - button "Narrateur" [ref=f1e49] [cursor=pointer]
            - textbox "Qui parle ? (Narrateur, Petit Zébu…)" [ref=f1e50]: Narrateur
            - textbox "Ce que dit le personnage" [ref=f1e51]
            - generic [ref=f1e52]:
              - button "Annuler" [ref=f1e53] [cursor=pointer]
              - button "Ajouter" [disabled] [ref=f1e54]
          - generic [ref=f1e55]:
            - generic [ref=f1e56]:
              - generic [ref=f1e57]: Page 2
              - generic [ref=f1e58]: 0 répliques
            - button "Ajouter une réplique" [ref=f1e59] [cursor=pointer]
          - button "Suivant" [disabled] [ref=f1e60]
        - button "Retour" [ref=f1e61] [cursor=pointer]
    - navigation [ref=f1e62]:
      - generic [ref=f1e63]:
        - link "Bibliothèque" [ref=f1e64] [cursor=pointer]:
          - /url: /home
        - link "Messages" [ref=f1e65] [cursor=pointer]:
          - /url: /messages
        - link "Famille" [ref=f1e66] [cursor=pointer]:
          - /url: /family
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
  9   |     await card.locator('.picker', { hasText: member }).click()
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
  38  |         await expect(page.getByText('Scanner les pages')).toBeVisible()
  39  |         await expect(page.getByText('1/4')).toBeVisible()
  40  |         await page.locator('input[type=file]').setInputFiles([pngFile('p1.png'), pngFile('p2.png')])
  41  |         await expect(page.locator('.thumb')).toHaveCount(2)
  42  |         await page.locator('.thumb__remove').last().click()
  43  |         await expect(page.locator('.thumb')).toHaveCount(1)
  44  |         await page.locator('input[type=file]').setInputFiles(pngFile('p2.png'))
  45  |         await expect(page.locator('.thumb')).toHaveCount(2)
  46  |         await page.getByRole('button', { name: 'Suivant' }).click()
  47  | 
> 48  |         await expect(page.getByText('Les répliques')).toBeVisible()
      |                                                       ^ Error: expect(locator).toBeVisible() failed
  49  |         await expect(page.getByRole('button', { name: 'Suivant' })).toBeDisabled()
  50  |         await addLine(page, 1, 'Narrateur', 'Au bord du lac, le zébu regardait les oiseaux.')
  51  |         await addLine(page, 1, 'Petit Zébu', 'Pourquoi je n’ai pas d’ailes ?')
  52  |         await addLine(page, 2, 'Maman Zébu', 'Parce que tu as quatre pattes solides.')
  53  |         await addLine(page, 2, 'Narrateur', 'Et le lémurien bondit de branche en branche.')
  54  |         await page.locator('.card', { has: page.getByText('Page 1', { exact: true }) }).getByRole('button', { name: '×' }).last().click()
  55  |         await addLine(page, 1, 'Petit Zébu', 'Pourquoi je n’ai pas d’ailes ?')
  56  |         await page.getByRole('button', { name: 'Suivant' }).click()
  57  | 
  58  |         await expect(page.getByText('Colorier les voix')).toBeVisible()
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
  70  |         await expect(page.getByText('Vérifier')).toBeVisible()
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
  110 |         await expect(page).toHaveURL(/\/play$/)
  111 |         const book = await apiJson<{ status: string; lines: { audioFileId: string | null; audioMs: number }[] }>(page, `/books/${bookId}`)
  112 |         expect(book.status).toBe('ready')
  113 |         expect(book.lines.every(line => line.audioFileId !== null && line.audioMs > 500)).toBeTruthy()
  114 |     })
  115 | 
  116 |     test('plays the book from the parent reader', async ({ page }, info) => {
  117 |         await login(page)
  118 |         await chooseProfile(page, 'Parent')
  119 |         await page.goto(`/books/${bookId}/play`)
  120 |         await expect(page.getByRole('heading', { name: `Le petit zébu ${info.project.name}` })).toBeVisible()
  121 |         await expect(page.getByText('Pourquoi je n’ai pas d’ailes ?')).toBeVisible()
  122 |         await page.getByRole('button', { name: 'Lecture' }).click()
  123 |         await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  124 |         await page.getByRole('button', { name: 'Suivant' }).click()
  125 |         await page.getByRole('button', { name: 'Précédent' }).click()
  126 |         await page.getByRole('button', { name: /1×/ }).click()
  127 |         await expect(page.getByRole('button', { name: /1.25×/ })).toBeVisible()
  128 |         await page.getByRole('button', { name: 'Pause' }).click()
  129 |         await expect(page.getByRole('button', { name: 'Lecture' })).toBeVisible()
  130 |         await page.locator('.card--tap', { hasText: 'Parce que tu as quatre pattes solides.' }).click()
  131 |         await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible()
  132 |     })
  133 | 
  134 |     test('shows the published book as ready and deletes another one', async ({ page }, info) => {
  135 |         await login(page)
  136 |         await chooseProfile(page, 'Parent')
  137 |         await expect(page.locator('a.card', { hasText: `Le petit zébu ${info.project.name}` })).toContainText('Prêt')
  138 |         const response = await page.request.post('/api/books', {
  139 |             data: { title: 'A supprimer', kind: 'multi', soloMemberId: null, imageDesc: '', pageFileIds: [], lines: [{ pageIndex: 0, character: '', text: 'x' }] },
  140 |         })
  141 |         const created = (await response.json()) as { id: string }
  142 |         await page.goto(`/books/${created.id}/studio`)
  143 |         page.once('dialog', dialog => dialog.accept())
  144 |         await page.getByRole('button', { name: 'Supprimer ce livre' }).click()
  145 |         await expect(page).toHaveURL(/\/home/)
  146 |         const list = await apiJson<{ id: string }[]>(page, '/books')
  147 |         expect(list.some(book => book.id === created.id)).toBeFalsy()
  148 |     })
```