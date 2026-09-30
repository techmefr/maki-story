# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 08-responsive.spec.ts >> responsive layout >> the profile switcher opens as a sheet and closes
- Location: tests/e2e/08-responsive.spec.ts:47:5

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
  5   | export const PARENT_NAME = process.env.E2E_PARENT_NAME ?? 'Parent'
  6   | export const E2E_PASSWORD = process.env.E2E_PASSWORD ?? 'e2e-password'
  7   | 
  8   | const PNG_PIXEL = Buffer.from(
  9   |     'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  10  |     'base64',
  11  | )
  12  | 
  13  | export const pngFile = (name: string): { name: string; mimeType: string; buffer: Buffer } => ({
  14  |     name,
  15  |     mimeType: 'image/png',
  16  |     buffer: PNG_PIXEL,
  17  | })
  18  | 
> 19  | export const login = async (page: Page): Promise<void> => {
      |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3200/login
  20  |     await page.goto('/login')
  21  |     await page.getByLabel('E-mail').fill(E2E_EMAIL)
  22  |     await page.getByLabel('Mot de passe').fill(E2E_PASSWORD)
  23  |     await page.getByRole('button', { name: 'Se connecter' }).click()
  24  |     await expect(page).toHaveURL(/\/profiles/)
  25  | }
  26  | 
  27  | export const chooseProfile = async (page: Page, name: string): Promise<void> => {
  28  |     await page.goto('/profiles')
  29  |     await page.locator('button.card', { hasText: name }).first().click()
  30  |     await expect(page).not.toHaveURL(/\/profiles/)
  31  | }
  32  | 
  33  | export const switchProfile = async (page: Page, name: string): Promise<void> => {
  34  |     await page.getByRole('button', { name: 'Changer de profil' }).click()
  35  |     await page.locator('.sheet button.card', { hasText: name }).first().click()
  36  |     await expect(page.locator('.sheet')).toHaveCount(0)
  37  | }
  38  | 
  39  | export const addMember = async (page: Page, name: string, role: 'Parent' | 'Proche' | 'Enfant'): Promise<void> => {
  40  |     await page.goto('/family/add')
  41  |     await page.getByPlaceholder('Maman, Mamie, Lova…').fill(name)
  42  |     await page.getByRole('button', { name: role, exact: true }).click()
  43  |     await page.getByRole('button', { name: 'Enregistrer' }).click()
  44  |     await expect(page).toHaveURL(/\/family$/)
  45  |     await expect(page.getByText(name, { exact: true }).first()).toBeVisible()
  46  | }
  47  | 
  48  | export const recordOnce = async (page: Page, _unused?: Locator, ms = 1300): Promise<void> => {
  49  |     await page.getByRole('button', { name: 'Enregistrer' }).click()
  50  |     await expect(page.getByRole('button', { name: 'Arrêter' })).toBeVisible()
  51  |     await page.waitForTimeout(ms)
  52  |     await page.getByRole('button', { name: 'Arrêter' }).click()
  53  | }
  54  | 
  55  | export const apiJson = async <T>(page: Page, path: string): Promise<T> => {
  56  |     const response = await page.request.get(`/api${path}`)
  57  |     expect(response.ok()).toBeTruthy()
  58  |     return (await response.json()) as T
  59  | }
  60  | 
  61  | export const addLine = async (page: Page, pageNumber: number, character: string | null, text: string): Promise<void> => {
  62  |     const card = page.locator('.card', { has: page.getByText(`Page ${pageNumber}`, { exact: true }) })
  63  |     if ((await card.locator('textarea.input').count()) === 0) {
  64  |         await card.getByRole('button', { name: 'Ajouter une réplique' }).click()
  65  |     }
  66  |     if (character !== null) {
  67  |         await card.getByPlaceholder('Qui parle ? (Narrateur, Petit Zébu…)').fill(character)
  68  |     }
  69  |     await card.locator('textarea.input').fill(text)
  70  |     await card.getByRole('button', { name: 'Ajouter', exact: true }).click()
  71  |     await expect(card.getByText(text, { exact: true })).toBeVisible()
  72  | }
  73  | 
  74  | export const uniqueName = (base: string, projectName: string): string => `${base}-${projectName}`
  75  | 
  76  | export const fakeAudioBytes = (): Buffer => Buffer.from('GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAAHTEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBVJqWZTrIHfTbuMU6uEFlSua1OsggEwTbuMU6uEHFO7a1OsggHk', 'base64')
  77  | 
  78  | export const makeWav = (ms: number): Buffer => {
  79  |     const rate = 8000
  80  |     const samples = Math.round((rate * ms) / 1000)
  81  |     const data = Buffer.alloc(samples * 2)
  82  |     for (let i = 0; i < samples; i++) {
  83  |         data.writeInt16LE(Math.round(Math.sin((2 * Math.PI * 440 * i) / rate) * 8000), i * 2)
  84  |     }
  85  |     const header = Buffer.alloc(44)
  86  |     header.write('RIFF', 0)
  87  |     header.writeUInt32LE(36 + data.length, 4)
  88  |     header.write('WAVEfmt ', 8)
  89  |     header.writeUInt32LE(16, 16)
  90  |     header.writeUInt16LE(1, 20)
  91  |     header.writeUInt16LE(1, 22)
  92  |     header.writeUInt32LE(rate, 24)
  93  |     header.writeUInt32LE(rate * 2, 28)
  94  |     header.writeUInt16LE(2, 32)
  95  |     header.writeUInt16LE(16, 34)
  96  |     header.write('data', 36)
  97  |     header.writeUInt32LE(data.length, 40)
  98  |     return Buffer.concat([header, data])
  99  | }
  100 | 
  101 | export interface IApiMember {
  102 |     id: string
  103 |     name: string
  104 |     role: string
  105 | }
  106 | 
  107 | export interface IReadyLine {
  108 |     pageIndex: number
  109 |     character: string
  110 |     text: string
  111 |     memberName: string
  112 | }
  113 | 
  114 | export const uploadWav = async (page: Page, ms = 700): Promise<string> => {
  115 |     const response = await page.request.post('/api/files', { data: makeWav(ms), headers: { 'content-type': 'audio/wav' } })
  116 |     expect(response.ok()).toBeTruthy()
  117 |     return ((await response.json()) as { id: string }).id
  118 | }
  119 | 
```