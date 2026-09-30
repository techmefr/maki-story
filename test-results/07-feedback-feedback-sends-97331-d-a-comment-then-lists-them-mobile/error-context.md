# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 07-feedback.spec.ts >> feedback >> sends a mood and a comment then lists them
- Location: tests/e2e/07-feedback.spec.ts:5:5

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Super écran mobile')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Super écran mobile') with timeout 10000ms
  - waiting for getByText('Super écran mobile')

```

# Page snapshot

```yaml
- generic [ref=f2e3]:
  - status [ref=f2e4]: Tantara
  - generic [ref=f2e5]:
    - generic [ref=f2e6]:
      - banner [ref=f2e7]:
        - link "Tantara" [ref=f2e8] [cursor=pointer]:
          - /url: /home
        - generic [ref=f2e32]:
          - button "Avis" [ref=f2e34] [cursor=pointer]
          - button "Changer de profil" [ref=f2e38] [cursor=pointer]:
            - generic [ref=f2e39]: P
      - generic [ref=f2e40]:
        - link "Retour" [ref=f2e41] [cursor=pointer]:
          - /url: /family
        - heading "Avis des testeurs" [level=1] [ref=f2e42]
        - generic [ref=f2e43]:
          - generic [ref=f2e44]:
            - generic [ref=f2e45]: J’adore
            - generic [ref=f2e46]: Parent · /home
          - generic [ref=f2e47]: Super écran mobile
          - generic [ref=f2e48]: 01/10/2026 01:07:11
    - navigation [ref=f2e49]:
      - generic [ref=f2e50]:
        - link "Bibliothèque" [ref=f2e51] [cursor=pointer]:
          - /url: /home
        - link "Messages" [ref=f2e55] [cursor=pointer]:
          - /url: /messages
        - link "Famille" [ref=f2e59] [cursor=pointer]:
          - /url: /family
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | import { chooseProfile, login, PARENT_NAME } from './helpers'
  3  | 
  4  | test.describe('feedback', () => {
  5  |     test('sends a mood and a comment then lists them', async ({ page }, info) => {
  6  |         const comment = `Super écran ${info.project.name}`
  7  |         await login(page)
  8  |         await chooseProfile(page, PARENT_NAME)
  9  |         await page.getByRole('button', { name: 'Avis' }).click()
  10 |         await expect(page.getByRole('button', { name: 'Envoyer' })).toBeDisabled()
  11 |         await page.getByRole('button', { name: 'J’adore' }).click()
  12 |         await page.getByPlaceholder(/Ce qui marche/).fill(comment)
  13 |         await page.getByRole('button', { name: 'Envoyer' }).click()
  14 |         await expect(page.getByText('Merci, c’est noté.')).toBeVisible()
  15 |         await page.goto('/feedback')
> 16 |         await expect(page.getByText(comment)).toBeVisible()
     |                                               ^ Error: expect(locator).toBeVisible() failed
  17 |         await expect(page.getByText('J’adore').first()).toBeVisible()
  18 |     })
  19 | 
  20 |     test('rejects an empty feedback through the api', async ({ page }) => {
  21 |         await login(page)
  22 |         const response = await page.request.post('/api/feedback', { data: { memberName: 'x', screen: '/', mood: null, text: '  ' } })
  23 |         expect(response.status()).toBe(400)
  24 |     })
  25 | })
  26 | 
```