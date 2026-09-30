# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 08-responsive.spec.ts >> responsive layout >> never scrolls horizontally on any screen
- Location: tests/e2e/08-responsive.spec.ts:25:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3200/login
Call log:
  - navigating to "http://localhost:3200/login", waiting until "load"

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
> 19  |     await page.goto('/login')
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3200/login
  20  |     await page.getByLabel('E-mail').fill(E2E_EMAIL)
  21  |     await page.getByLabel('Mot de passe').fill(E2E_PASSWORD)
  22  |     await page.getByRole('button', { name: 'Se connecter' }).click()
  23  |     await expect(page).toHaveURL(/\/profiles/)
  24  | }
  25  | 
  26  | export const chooseProfile = async (page: Page, name: string): Promise<void> => {
  27  |     await page.goto('/profiles')
  28  |     await page.locator('button.card', { hasText: name }).first().click()
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
  47  | export const recordOnce = async (page: Page, _unused?: Locator, ms = 1300): Promise<void> => {
  48  |     await page.getByRole('button', { name: 'Enregistrer' }).click()
  49  |     await expect(page.getByRole('button', { name: 'Arrêter' })).toBeVisible()
  50  |     await page.waitForTimeout(ms)
  51  |     await page.getByRole('button', { name: 'Arrêter' }).click()
  52  | }
  53  | 
  54  | export const apiJson = async <T>(page: Page, path: string): Promise<T> => {
  55  |     const response = await page.request.get(`/api${path}`)
  56  |     expect(response.ok()).toBeTruthy()
  57  |     return (await response.json()) as T
  58  | }
  59  | 
  60  | export const addLine = async (page: Page, pageNumber: number, character: string | null, text: string): Promise<void> => {
  61  |     const card = page.locator('.card', { has: page.getByText(`Page ${pageNumber}`, { exact: true }) })
  62  |     if ((await card.locator('textarea.input').count()) === 0) {
  63  |         await card.getByRole('button', { name: 'Ajouter une réplique' }).click()
  64  |     }
  65  |     if (character !== null) {
  66  |         await card.getByPlaceholder('Qui parle ? (Narrateur, Petit Zébu…)').fill(character)
  67  |     }
  68  |     await card.locator('textarea.input').fill(text)
  69  |     await card.getByRole('button', { name: 'Ajouter', exact: true }).click()
  70  |     await expect(card.getByText(text, { exact: true })).toBeVisible()
  71  | }
  72  | 
  73  | export const uniqueName = (base: string, projectName: string): string => `${base}-${projectName}`
  74  | 
  75  | export const fakeAudioBytes = (): Buffer => Buffer.from('GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAHTEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBVJqWZTrIHfTbuMU6uEFlSua1OsggEwTbuMU6uEHFO7a1OsggHk', 'base64')
  76  | 
  77  | export const makeWav = (ms: number): Buffer => {
  78  |     const rate = 8000
  79  |     const samples = Math.round((rate * ms) / 1000)
  80  |     const data = Buffer.alloc(samples * 2)
  81  |     for (let i = 0; i < samples; i++) {
  82  |         data.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 8000), i * 2)
  83  |     }
  84  |     const header = Buffer.alloc(44)
  85  |     header.write('RIFF', 0)
  86  |     header.writeUInt32LE(36 + data.length, 4)
  87  |     header.write('WAVEfmt ', 8)
  88  |     header.writeUInt32LE(16, 16)
  89  |     header.writeUInt16LE(1, 20)
  90  |     header.writeUInt16LE(1, 22)
  91  |     header.writeUInt32LE(rate, 24)
  92  |     header.writeUInt32LE(rate * 2, 28)
  93  |     header.writeUInt16LE(2, 32)
  94  |     header.writeUInt16LE(16, 34)
  95  |     header.write('data', 36)
  96  |     header.writeUInt32LE(data.length, 40)
  97  |     return Buffer.concat([header, data])
  98  | }
  99  | 
  100 | export interface IApiMember {
  101 |     id: string
  102 |     name: string
  103 |     role: string
  104 | }
  105 | 
  106 | export interface IReadyLine {
  107 |     pageIndex: number
  108 |     character: string
  109 |     text: string
  110 |     memberName: string
  111 | }
  112 | 
  113 | export const uploadWav = async (page: Page, ms = 700): Promise<string> => {
  114 |     const response = await page.request.post('/api/files', { data: makeWav(ms), headers: { 'content-type': 'audio/wav' } })
  115 |     expect(response.ok()).toBeTruthy()
  116 |     return ((await response.json()) as { id: string }).id
  117 | }
  118 | 
  119 | export const createReadyBook = async (
```