# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 08-responsive.spec.ts >> responsive layout >> the login page fits the screen
- Location: tests/e2e/08-responsive.spec.ts:41:5

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3200/login
Call log:
  - navigating to "http://localhost:3200/login", waiting until "load"

```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test'
  2  | import type { Page } from '@playwright/test'
  3  | import { chooseProfile, login, uniqueName } from './helpers'
  4  | 
  5  | const hasNoHorizontalScroll = async (page: Page): Promise<boolean> => {
  6  |     return page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
  7  | }
  8  | 
  9  | test.describe('responsive layout', () => {
  10 |     test('uses the right navigation for the screen size', async ({ page }, info) => {
  11 |         await login(page)
  12 |         await chooseProfile(page, 'Parent')
  13 |         const isDesktop = info.project.name === 'desktop'
  14 |         await expect(page.locator('.tabbar')).toBeVisible({ visible: !isDesktop })
  15 |         await expect(page.locator('.nav')).toBeVisible({ visible: isDesktop })
  16 |         const links = isDesktop ? page.locator('.nav .nav__item') : page.locator('.tabbar__item')
  17 |         await links.filter({ hasText: 'Messages' }).click()
  18 |         await expect(page).toHaveURL(/\/messages/)
  19 |         await links.filter({ hasText: 'Famille' }).click()
  20 |         await expect(page).toHaveURL(/\/family/)
  21 |         await links.filter({ hasText: 'Bibliothèque' }).click()
  22 |         await expect(page).toHaveURL(/\/home/)
  23 |     })
  24 | 
  25 |     test('never scrolls horizontally on any screen', async ({ page }, info) => {
  26 |         await login(page)
  27 |         await chooseProfile(page, 'Parent')
  28 |         for (const path of ['/home', '/books/new', '/family', '/family/add', '/messages', '/feedback', '/profiles']) {
  29 |             await page.goto(path)
  30 |             await page.waitForLoadState('networkidle')
  31 |             expect(await hasNoHorizontalScroll(page), `horizontal scroll on ${path}`).toBeTruthy()
  32 |         }
  33 |         await chooseProfile(page, uniqueName('Lova', info.project.name))
  34 |         for (const path of ['/kid', '/kid/library']) {
  35 |             await page.goto(path)
  36 |             await page.waitForLoadState('networkidle')
  37 |             expect(await hasNoHorizontalScroll(page), `horizontal scroll on ${path}`).toBeTruthy()
  38 |         }
  39 |     })
  40 | 
  41 |     test('the login page fits the screen', async ({ page }) => {
> 42 |         await page.goto('/login')
     |                    ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:3200/login
  43 |         await expect(page.getByRole('button', { name: 'Se connecter' })).toBeInViewport()
  44 |         expect(await hasNoHorizontalScroll(page)).toBeTruthy()
  45 |     })
  46 | 
  47 |     test('the profile switcher opens as a sheet and closes', async ({ page }) => {
  48 |         await login(page)
  49 |         await chooseProfile(page, 'Parent')
  50 |         await page.getByRole('button', { name: 'Changer de profil' }).click()
  51 |         await expect(page.locator('.sheet')).toBeVisible()
  52 |         await page.locator('.sheet-backdrop').click({ position: { x: 5, y: 5 } })
  53 |         await expect(page.locator('.sheet')).toHaveCount(0)
  54 |     })
  55 | })
  56 | 
```