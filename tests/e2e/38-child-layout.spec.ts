import { expect, test } from '@playwright/test'
import { chooseProfile, login, PARENT_NAME } from './helpers'

test('child screens fit narrow and wide viewports in both themes without adult controls', async ({ page }, info) => {
    await login(page)
    await chooseProfile(page, PARENT_NAME)
    const name = `Layout child ${info.project.name}`
    const response = await page.request.post('/api/members', { data: { name, role: 'child', color: 'sky', code: { kind: 'symbols', value: '0000' } } })
    expect(response.ok(), await response.text()).toBeTruthy()
    await chooseProfile(page, name)
    await expect(page.locator('.kid-home__welcome')).toBeVisible()
    await expect(page.getByTestId('adult-home-welcome')).toHaveCount(0)
    for (const width of [320, 390, 1180, 1600]) {
        await page.setViewportSize({ width, height: 900 })
        for (const path of ['/kid', '/kid/library', '/kid/treasure']) {
            await page.goto(path)
            await expect(page.locator('.kid.shell')).toBeVisible()
            for (const theme of ['light', 'dark']) {
                await page.evaluate(value => { document.documentElement.dataset.theme = value }, theme)
                const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
                expect(overflow, `${path} ${width} ${theme}`).toBeLessThanOrEqual(1)
                await expect(page.locator('.shell--adult')).toHaveCount(0)
            }
        }
    }
})

test('child mockup navigates from a voice message to its own treasure and through story pages', async ({ page }) => {
    await page.goto('/maquettes/enfants.html')
    await page.getByRole('button', { name: '2 messages de Mamie Rose', exact: true }).click()
    await page.getByRole('button', { name: 'Garder', exact: false }).click()
    await page.getByRole('navigation').getByRole('button', { name: 'Coffre', exact: false }).click()
    await expect(page.getByText('3 souvenirs sur 10, rien que pour toi.')).toBeVisible()
    await page.getByRole('navigation').getByRole('button', { name: 'Livres', exact: false }).click()
    await page.getByRole('button', { name: 'Écouter Le petit lémurien', exact: true }).click()
    await page.getByRole('button', { name: 'Écouter l’histoire', exact: true }).click()
    for (let index = 0; index < 3; index++) {
        await page.getByRole('button', { name: 'Page suivante', exact: true }).click()
    }
    await expect(page.getByRole('heading', { name: 'Bravo, histoire terminée !' })).toBeVisible()
})
