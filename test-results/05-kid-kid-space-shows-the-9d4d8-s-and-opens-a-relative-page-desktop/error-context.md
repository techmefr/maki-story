# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 05-kid.spec.ts >> kid space >> shows the relatives faces and opens a relative page
- Location: tests/e2e/05-kid.spec.ts:28:5

# Error details

```
TypeError: Cannot read properties of undefined (reading 'id')
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - status [ref=e4]: Tantara
  - generic [ref=e6]:
    - button "Se déconnecter" [ref=e30] [cursor=pointer]
    - heading "Qui écoute ?" [level=1] [ref=e31]
    - button "P Parent Parent" [ref=e32] [cursor=pointer]:
      - generic [ref=e33]: P
      - generic [ref=e34]:
        - generic [ref=e35]: Parent
        - generic [ref=e36]: Parent
    - button "Mamie-mobile Proche" [ref=e37] [cursor=pointer]:
      - generic [ref=e39]:
        - generic [ref=e40]: Mamie-mobile
        - generic [ref=e41]: Proche
    - button "L Lova-mobile Enfant" [ref=e42] [cursor=pointer]:
      - generic [ref=e43]: L
      - generic [ref=e44]:
        - generic [ref=e45]: Lova-mobile
        - generic [ref=e46]: Enfant
    - button "P Papa-mobile Parent" [ref=e47] [cursor=pointer]:
      - generic [ref=e48]: P
      - generic [ref=e49]:
        - generic [ref=e50]: Papa-mobile
        - generic [ref=e51]: Parent
    - link "Ajouter un proche" [ref=e52] [cursor=pointer]:
      - /url: /family/add
```

# Test source

```ts
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
  120 |     page: Page,
  121 |     title: string,
  122 |     kind: 'multi' | 'solo',
  123 |     lines: IReadyLine[],
  124 | ): Promise<string> => {
  125 |     const members = await apiJson<IApiMember[]>(page, '/members')
> 126 |     const find = (name: string): string => members.find(member => member.name === name)!.id
      |                                                                                        ^ TypeError: Cannot read properties of undefined (reading 'id')
  127 |     const soloMemberId = kind === 'solo' ? find(lines[0]!.memberName) : null
  128 |     const created = await page.request.post('/api/books', {
  129 |         data: {
  130 |             title,
  131 |             kind,
  132 |             soloMemberId,
  133 |             imageDesc: '',
  134 |             pageFileIds: [],
  135 |             lines: lines.map(line => ({ pageIndex: line.pageIndex, character: line.character, text: line.text })),
  136 |         },
  137 |     })
  138 |     const { id } = (await created.json()) as { id: string }
  139 |     const book = await apiJson<{ lines: { id: string }[] }>(page, `/books/${id}`)
  140 |     await page.request.patch(`/api/books/${id}`, {
  141 |         data: { lines: book.lines.map((line, index) => ({ id: line.id, memberId: find(lines[index]!.memberName) })) },
  142 |     })
  143 |     for (const line of book.lines) {
  144 |         const fileId = await uploadWav(page)
  145 |         const response = await page.request.put(`/api/books/${id}/lines/${line.id}/audio`, { data: { fileId, ms: 700 } })
  146 |         expect(response.ok()).toBeTruthy()
  147 |     }
  148 |     await page.request.patch(`/api/books/${id}`, { data: { status: 'ready' } })
  149 |     return id
  150 | }
  151 | 
```