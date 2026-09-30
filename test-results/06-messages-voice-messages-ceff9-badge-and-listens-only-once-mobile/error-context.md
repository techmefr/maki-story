# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 06-messages.spec.ts >> voice messages >> the relative sees the unread badge and listens only once
- Location: tests/e2e/06-messages.spec.ts:43:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Ce message a déjà été écouté')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Ce message a déjà été écouté') with timeout 10000ms
  - waiting for getByText('Ce message a déjà été écouté')

```

```yaml
- status: Tantara
- text: L
- heading "Lova-mobile" [level=1]
- button "Écouter"
- link "Fermer":
  - /url: /messages
```

# Test source

```ts
  1   | import { expect, test } from '@playwright/test'
  2   | import type { Page } from '@playwright/test'
  3   | import { apiJson, chooseProfile, login, recordOnce, uniqueName, uploadWav } from './helpers'
  4   | import type { IApiMember } from './helpers'
  5   | 
  6   | test.describe.configure({ mode: 'serial' })
  7   | 
  8   | interface IApiMessage {
  9   |     id: string
  10  |     fromMemberId: string
  11  |     toMemberId: string
  12  |     listenedAt: string | null
  13  | }
  14  | 
  15  | const idOf = async (page: Page, name: string): Promise<string> => {
  16  |     const members = await apiJson<IApiMember[]>(page, '/members')
  17  |     return members.find(member => member.name === name)!.id
  18  | }
  19  | 
  20  | const sendVoiceMessage = async (page: Page): Promise<void> => {
  21  |     await recordOnce(page, page.getByRole('button', { name: 'Enregistrer' }))
  22  |     await expect(page.getByRole('button', { name: 'Envoyer' })).toBeVisible()
  23  |     await page.getByRole('button', { name: 'Envoyer' }).click()
  24  |     await expect(page.getByText('Envoyé !')).toBeVisible()
  25  | }
  26  | 
  27  | test.describe('voice messages', () => {
  28  |     test('a child sends a message to a relative', async ({ page }, info) => {
  29  |         const project = info.project.name
  30  |         await login(page)
  31  |         await chooseProfile(page, uniqueName('Lova', project))
  32  |         await page.locator('.face__link', { hasText: uniqueName('Mamie', project) }).click()
  33  |         await page.getByRole('link', { name: 'Envoyer un message' }).click()
  34  |         await expect(page.getByRole('heading', { name: new RegExp('Un message pour') })).toBeVisible()
  35  |         await recordOnce(page, page.getByRole('button', { name: 'Enregistrer' }))
  36  |         await page.getByRole('button', { name: 'Refaire' }).click()
  37  |         await sendVoiceMessage(page)
  38  |         await expect(page).toHaveURL(/\/kid$/, { timeout: 10000 })
  39  |         await page.locator('.face__link', { hasText: uniqueName('Mamie', project) }).click()
  40  |         await expect(page.getByText('Envoyé', { exact: true })).toBeVisible()
  41  |     })
  42  | 
  43  |     test('the relative sees the unread badge and listens only once', async ({ page }, info) => {
  44  |         const project = info.project.name
  45  |         await login(page)
  46  |         await chooseProfile(page, uniqueName('Mamie', project))
  47  |         await page.goto('/home')
  48  |         await expect(page.locator('a.card', { hasText: /message/ }).first()).toBeVisible()
  49  |         await expect(page.locator('.pop:visible').first()).toBeVisible()
  50  |         await page.goto('/messages')
  51  |         const card = page.locator('.card', { hasText: uniqueName('Lova', project) })
  52  |         await expect(card.getByText('Un message t’attend')).toBeVisible()
  53  |         await card.getByRole('link', { name: 'Écouter son message' }).click()
  54  |         await page.getByRole('button', { name: 'Écouter' }).click()
  55  |         await expect(page.getByRole('link', { name: 'Répondre' })).toBeVisible({ timeout: 15000 })
  56  |         await page.reload()
> 57  |         await expect(page.getByText('Ce message a déjà été écouté')).toBeVisible()
      |                                                                      ^ Error: expect(locator).toBeVisible() failed
  58  |         await page.goto('/messages')
  59  |         await expect(card.getByRole('link', { name: 'Écouter son message' })).toHaveCount(0)
  60  |     })
  61  | 
  62  |     test('the child sees the message as listened', async ({ page }, info) => {
  63  |         const project = info.project.name
  64  |         await login(page)
  65  |         await chooseProfile(page, uniqueName('Lova', project))
  66  |         await page.locator('.face__link', { hasText: uniqueName('Mamie', project) }).click()
  67  |         await expect(page.getByText('A écouté ✓')).toBeVisible()
  68  |     })
  69  | 
  70  |     test('the relative answers and the child listens to the reply', async ({ page }, info) => {
  71  |         const project = info.project.name
  72  |         await login(page)
  73  |         await chooseProfile(page, uniqueName('Mamie', project))
  74  |         await page.goto('/messages')
  75  |         await page.locator('.card', { hasText: uniqueName('Lova', project) }).getByRole('link', { name: 'Lui envoyer un message' }).click()
  76  |         await sendVoiceMessage(page)
  77  |         await expect(page).toHaveURL(/\/messages/, { timeout: 10000 })
  78  |         await page.getByRole('button', { name: 'Changer de profil' }).click()
  79  |         await page.locator('.sheet button.card', { hasText: uniqueName('Lova', project) }).click()
  80  |         await expect(page).toHaveURL(/\/kid$/)
  81  |         await expect(page.locator('.face__bubble')).toBeVisible()
  82  |         await page.locator('.face__bubble').click()
  83  |         await page.getByRole('button', { name: 'Écouter' }).click()
  84  |         await expect(page.getByRole('link', { name: 'Répondre' })).toBeVisible({ timeout: 15000 })
  85  |         await page.getByRole('link', { name: 'Répondre' }).click()
  86  |         await expect(page.getByRole('heading', { name: /Réponds à/ })).toBeVisible()
  87  |     })
  88  | 
  89  |     test('keeps only the five latest messages per conversation', async ({ page }, info) => {
  90  |         const project = info.project.name
  91  |         await login(page)
  92  |         const lova = await idOf(page, uniqueName('Lova', project))
  93  |         const mamie = await idOf(page, uniqueName('Mamie', project))
  94  |         for (let i = 0; i < 7; i++) {
  95  |             const fileId = await uploadWav(page, 300)
  96  |             const response = await page.request.post('/api/messages', {
  97  |                 data: { fromMemberId: lova, toMemberId: mamie, fileId, mime: 'audio/wav', durationMs: 300 },
  98  |             })
  99  |             expect(response.ok()).toBeTruthy()
  100 |         }
  101 |         const all = await apiJson<IApiMessage[]>(page, '/messages')
  102 |         const pair = all.filter(
  103 |             message =>
  104 |                 (message.fromMemberId === lova && message.toMemberId === mamie) ||
  105 |                 (message.fromMemberId === mamie && message.toMemberId === lova),
  106 |         )
  107 |         expect(pair).toHaveLength(5)
  108 |     })
  109 | 
  110 |     test('rejects invalid messages', async ({ page }) => {
  111 |         await login(page)
  112 |         const response = await page.request.post('/api/messages', { data: { fromMemberId: 'a', toMemberId: 'a', fileId: 'f', mime: 'audio/wav' } })
  113 |         expect(response.status()).toBe(400)
  114 |     })
  115 | })
  116 | 
```