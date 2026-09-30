# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 02-family.spec.ts >> family >> starts with a single parent profile
- Location: tests/e2e/02-family.spec.ts:12:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('button.card').first()
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('button.card').first() with timeout 10000ms
  - waiting for locator('button.card').first()

```

```yaml
- status: Tantara
- banner:
  - link "Tantara":
    - /url: /home
    - img
    - text: Tantara
  - button "Avis"
  - button "Changer de profil": P
- heading "Bibliothèque" [level=1]
- link "P Fais ta grimace ! Une photo rigolote pour que l’enfant te reconnaisse.":
  - /url: /grimace
- link "Nouveau livre":
  - /url: /books/new
- img
- paragraph: Aucun livre pour l’instant
- paragraph: Photographie les pages d’un livre papier, découpe les répliques et colorie les voix.
- navigation:
  - link "Bibliothèque":
    - /url: /home
  - link "Messages":
    - /url: /messages
  - link "Famille":
    - /url: /family
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | import { addMember, apiJson, chooseProfile, login, pngFile, uniqueName } from './helpers'
  3  | 
  4  | test.describe.configure({ mode: 'serial' })
  5  | 
  6  | test.describe('family', () => {
  7  |     test.beforeEach(async ({ page }) => {
  8  |         await login(page)
  9  |         await chooseProfile(page, 'Parent')
  10 |     })
  11 | 
  12 |     test('starts with a single parent profile', async ({ page }) => {
  13 |         const members = await apiJson<{ role: string }[]>(page, '/members')
  14 |         expect(members.some(member => member.role === 'parent')).toBeTruthy()
> 15 |         await expect(page.locator('button.card').first()).toBeVisible()
     |                                                           ^ Error: expect(locator).toBeVisible() failed
  16 |     })
  17 | 
  18 |     test('adds a relative, a child and another parent', async ({ page }, info) => {
  19 |         const project = info.project.name
  20 |         await addMember(page, uniqueName('Mamie', project), 'Proche')
  21 |         await addMember(page, uniqueName('Lova', project), 'Enfant')
  22 |         await addMember(page, uniqueName('Papa', project), 'Parent')
  23 |         await page.goto('/family')
  24 |         await expect(page.getByText('Enfant', { exact: true }).first()).toBeVisible()
  25 |     })
  26 | 
  27 |     test('uploads a photo and edits a member', async ({ page }, info) => {
  28 |         const name = uniqueName('Mamie', info.project.name)
  29 |         await page.goto('/family')
  30 |         await page.locator('a.card', { hasText: name }).click()
  31 |         await page.getByRole('button', { name: 'Changer la photo' }).click()
  32 |         await page.locator('input[type=file]').setInputFiles(pngFile('face.png'))
  33 |         await page.getByRole('button', { name: 'Garder' }).click()
  34 |         await expect(page.locator('.sheet')).toHaveCount(0)
  35 |         await page.getByPlaceholder('Maman, Mamie, Lova…').fill(`${name}-ok`)
  36 |         await page.getByLabel('coral').click()
  37 |         await page.getByRole('button', { name: 'Enregistrer' }).click()
  38 |         await expect(page).toHaveURL(/\/family$/)
  39 |         await expect(page.getByText(`${name}-ok`)).toBeVisible()
  40 |         const members = await apiJson<{ name: string; photoFileId: string | null; color: string }[]>(page, '/members')
  41 |         const edited = members.find(member => member.name === `${name}-ok`)
  42 |         expect(edited?.photoFileId).not.toBeNull()
  43 |         expect(edited?.color).toBe('coral')
  44 |         await page.locator('a.card', { hasText: `${name}-ok` }).click()
  45 |         await page.getByPlaceholder('Maman, Mamie, Lova…').fill(name)
  46 |         await page.getByRole('button', { name: 'Enregistrer' }).click()
  47 |         await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
  48 |     })
  49 | 
  50 |     test('requires a name to save a member', async ({ page }) => {
  51 |         await page.goto('/family/add')
  52 |         await expect(page.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()
  53 |     })
  54 | 
  55 |     test('deletes a member after confirmation', async ({ page }, info) => {
  56 |         const name = uniqueName('Temporaire', info.project.name)
  57 |         await addMember(page, name, 'Proche')
  58 |         await page.locator('a.card', { hasText: name }).click()
  59 |         page.once('dialog', dialog => dialog.dismiss())
  60 |         await page.getByRole('button', { name: 'Supprimer ce proche' }).click()
  61 |         await expect(page).toHaveURL(/\/family\//)
  62 |         page.once('dialog', dialog => dialog.accept())
  63 |         await page.getByRole('button', { name: 'Supprimer ce proche' }).click()
  64 |         await expect(page).toHaveURL(/\/family$/)
  65 |         await expect(page.getByText(name, { exact: true })).toHaveCount(0)
  66 |     })
  67 | 
  68 |     test('lists members on the profile picker and opens the right space', async ({ page }, info) => {
  69 |         const child = uniqueName('Lova', info.project.name)
  70 |         await chooseProfile(page, child)
  71 |         await expect(page).toHaveURL(/\/kid/)
  72 |         await page.goto('/profiles')
  73 |         await page.locator('button.card', { hasText: 'Parent' }).first().click()
  74 |         await expect(page).toHaveURL(/\/home/)
  75 |     })
  76 | 
  77 |     test('rejects invalid member payloads', async ({ page }) => {
  78 |         const response = await page.request.post('/api/members', { data: { name: '', role: 'wizard', color: 'black' } })
  79 |         expect(response.status()).toBe(400)
  80 |     })
  81 | })
  82 | 
```