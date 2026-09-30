# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 04-book-solo.spec.ts >> single voice book >> a relative creates, records and publishes a solo book
- Location: tests/e2e/04-book-solo.spec.ts:7:5

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for locator('button.card').filter({ hasText: 'Mamie-mobile' }).first()

```

# Page snapshot

```yaml
- generic [ref=f1e3]:
  - status [ref=f1e4]: Tantara
  - generic [ref=f1e6]:
    - button "Se déconnecter" [ref=f1e30] [cursor=pointer]
    - heading "Qui écoute ?" [level=1] [ref=f1e31]
    - button "P Parent Parent" [ref=f1e32] [cursor=pointer]:
      - generic [ref=f1e33]: P
      - generic [ref=f1e34]:
        - generic [ref=f1e35]: Parent
        - generic [ref=f1e36]: Parent
    - link "Ajouter un proche" [ref=f1e37] [cursor=pointer]:
      - /url: /family/add
```

# Test source

```ts
  1   | import { expect } from '@playwright/test'
  2   | import type { Locator, Page } from '@playwright/test'
  3   | 
  4   | export const E2E_EMAIL = process.env.E2E_EMAIL ?? 'e2e@tantara.app'
  5   | export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'e2e-password'
  6   | 
  7   | const PNG_PIXEL = Buffer.from(
  8   |     'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  9   |     'base64',
  10  | )
  11  | 
  12  | export const pngFile = (name: string): { name: string; mimeType: string; buffer: Buffer } => ({
  13  |     name,
  14  |     mimeType: 'image/png',
  15  |     buffer: PNG_PIXEL,
  16  | })
  17  | 
  18  | export const login = async (page: Page): Promise<void> => {
  19  |     await page.goto('/login')
  20  |     await page.getByLabel('E-mail').fill(E2E_EMAIL)
  21  |     await page.getByLabel('Mot de passe').fill(E2E_PASSWORD)
  22  |     await page.getByRole('button', { name: 'Se connecter' }).click()
  23  |     await expect(page).toHaveURL(/\/profiles/)
  24  | }
  25  | 
  26  | export const chooseProfile = async (page: Page, name: string): Promise<void> => {
  27  |     await page.goto('/profiles')
> 28  |     await page.locator('button.card', { hasText: name }).first().click()
      |                                                                  ^ Error: locator.click: Test timeout of 90000ms exceeded.
  29  |     await expect(page).not.toHaveURL(/\/profiles/)
  30  | }
  31  | 
  32  | export const switchProfile = async (page: Page, name: string): Promise<void> => {
  33  |     await page.getByRole('button', { name: 'Changer de profil' }).click()
  34  |     await page.locator('.sheet button.card', { hasText: name }).first().click()
  35  |     await expect(page.locator('.sheet')).toHaveCount(0)
  36  | }
  37  | 
  38  | export const addMember = async (page: Page, name: string, role: 'Parent' | 'Proche' | 'Enfant'): Promise<void> => {
  39  |     await page.goto('/family/add')
  40  |     await page.getByPlaceholder('Maman, Mamie, Lova…').fill(name)
  41  |     await page.getByRole('button', { name: role, exact: true }).click()
  42  |     await page.getByRole('button', { name: 'Enregistrer' }).click()
  43  |     await expect(page).toHaveURL(/\/family$/)
  44  |     await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
  45  | }
  46  | 
  47  | export const recordOnce = async (page: Page, recordButton: Locator, ms = 1300): Promise<void> => {
  48  |     await recordButton.click()
  49  |     await page.waitForTimeout(ms)
  50  |     await recordButton.click()
  51  | }
  52  | 
  53  | export const apiJson = async <T>(page: Page, path: string): Promise<T> => {
  54  |     const response = await page.request.get(`/api${path}`)
  55  |     expect(response.ok()).toBeTruthy()
  56  |     return (await response.json()) as T
  57  | }
  58  | 
  59  | export const addLine = async (page: Page, pageNumber: number, character: string | null, text: string): Promise<void> => {
  60  |     const card = page.locator('.card', { has: page.getByText(`Page ${pageNumber}`, { exact: true }) })
  61  |     if ((await card.locator('textarea.input').count()) === 0) {
  62  |         await card.getByRole('button', { name: 'Ajouter une réplique' }).click()
  63  |     }
  64  |     if (character !== null) {
  65  |         await card.getByPlaceholder('Qui parle ? (Narrateur, Petit Zébu…)').fill(character)
  66  |     }
  67  |     await card.locator('textarea.input').fill(text)
  68  |     await card.getByRole('button', { name: 'Ajouter', exact: true }).click()
  69  |     await expect(card.getByText(text, { exact: true })).toBeVisible()
  70  | }
  71  | 
  72  | export const uniqueName = (base: string, projectName: string): string => `${base}-${projectName}`
  73  | 
  74  | export const fakeAudioBytes = (): Buffer => Buffer.from('GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAHTEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBVJqWZTrIHfTbuMU6uEFlSua1OsggEwTbuMU6uEHFO7a1OsggHk', 'base64')
  75  | 
  76  | export const makeWav = (ms: number): Buffer => {
  77  |     const rate = 8000
  78  |     const samples = Math.round((rate * ms) / 1000)
  79  |     const data = Buffer.alloc(samples * 2)
  80  |     for (let i = 0; i < samples; i++) {
  81  |         data.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 8000), i * 2)
  82  |     }
  83  |     const header = Buffer.alloc(44)
  84  |     header.write('RIFF', 0)
  85  |     header.writeUInt32LE(36 + data.length, 4)
  86  |     header.write('WAVEfmt ', 8)
  87  |     header.writeUInt32LE(16, 16)
  88  |     header.writeUInt16LE(1, 20)
  89  |     header.writeUInt16LE(1, 22)
  90  |     header.writeUInt32LE(rate, 24)
  91  |     header.writeUInt32LE(rate * 2, 28)
  92  |     header.writeUInt16LE(2, 32)
  93  |     header.writeUInt16LE(16, 34)
  94  |     header.write('data', 36)
  95  |     header.writeUInt32LE(data.length, 40)
  96  |     return Buffer.concat([header, data])
  97  | }
  98  | 
  99  | export interface IApiMember {
  100 |     id: string
  101 |     name: string
  102 |     role: string
  103 | }
  104 | 
  105 | export interface IReadyLine {
  106 |     pageIndex: number
  107 |     character: string
  108 |     text: string
  109 |     memberName: string
  110 | }
  111 | 
  112 | export const uploadWav = async (page: Page, ms = 700): Promise<string> => {
  113 |     const response = await page.request.post('/api/files', { data: makeWav(ms), headers: { 'content-type': 'audio/wav' } })
  114 |     expect(response.ok()).toBeTruthy()
  115 |     return ((await response.json()) as { id: string }).id
  116 | }
  117 | 
  118 | export const createReadyBook = async (
  119 |     page: Page,
  120 |     title: string,
  121 |     kind: 'multi' | 'solo',
  122 |     lines: IReadyLine[],
  123 | ): Promise<string> => {
  124 |     const members = await apiJson<IApiMember[]>(page, '/members')
  125 |     const find = (name: string): string => members.find(member => member.name === name)!.id
  126 |     const soloMemberId = kind === 'solo' ? find(lines[0]!.memberName) : null
  127 |     const created = await page.request.post('/api/books', {
  128 |         data: {
```