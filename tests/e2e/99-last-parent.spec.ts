import { expect, test } from '@playwright/test'
import { apiJson, login } from './helpers'

test('keeps at least one parent', async ({ page }) => {
    await login(page)
    const members = await apiJson<{ id: string; role: string }[]>(page, '/members')
    const parents = members.filter(member => member.role === 'parent')
    for (const parent of parents.slice(0, -1)) {
        const response = await page.request.delete(`/api/members/${parent.id}`)
        expect(response.ok()).toBeTruthy()
    }
    const last = parents[parents.length - 1]
    const refused = await page.request.delete(`/api/members/${last!.id}`)
    expect(refused.status()).toBe(400)
})
