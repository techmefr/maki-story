import { expect } from '@playwright/test'
import type { APIRequestContext, PlaywrightTestArgs } from '@playwright/test'
import { makeWav, PROFILE_PIN, signIn, uniqueAccount, useProfile } from './helpers'
import type { IE2eAccount } from './helpers'

export interface IFamilyApi {
    account: IE2eAccount
    parent: APIRequestContext
}

type Playwright = PlaywrightTestArgs['playwright']

export const profileApi = async (playwright: Playwright, baseURL: string | undefined, account: IE2eAccount, name: string): Promise<APIRequestContext> => {
    const api = await playwright.request.newContext({ baseURL })
    await signIn(api, account)
    await useProfile(api, name)
    return api
}

export const openFamily = async (playwright: Playwright, baseURL: string | undefined, label: string): Promise<IFamilyApi> => {
    const account = uniqueAccount(label)
    return { account, parent: await profileApi(playwright, baseURL, account, 'Parent') }
}

export const addMemberApi = async (parent: APIRequestContext, name: string, role: 'relative' | 'child' | 'parent'): Promise<string> => {
    const response = await parent.post('/api/members', { data: { name, role, color: 'coral', code: { kind: 'pin', value: PROFILE_PIN } } })
    expect(response.status(), await response.text()).toBe(200)
    return ((await response.json()) as { id: string }).id
}

export const uploadAudio = async (api: APIRequestContext): Promise<string> => {
    const response = await api.post('/api/files', { data: makeWav(300), headers: { 'content-type': 'audio/wav' } })
    expect(response.ok()).toBeTruthy()
    return ((await response.json()) as { id: string }).id
}

export const createBookApi = async (api: APIRequestContext, title: string, texts: string[]): Promise<{ id: string; lineIds: string[] }> => {
    const created = await api.post('/api/books', {
        data: {
            title,
            kind: 'multi',
            imageDesc: '',
            pageFileIds: [],
            lines: texts.map((text, index) => ({ pageIndex: 0, character: `Perso ${index}`, text })),
        },
    })
    expect(created.ok(), await created.text()).toBeTruthy()
    const { id } = (await created.json()) as { id: string }
    const detail = (await (await api.get(`/api/books/${id}`)).json()) as { lines: { id: string }[] }
    return { id, lineIds: detail.lines.map(line => line.id) }
}

export const inviteCode = async (parent: APIRequestContext): Promise<string> => {
    const response = await parent.get('/api/family/invite')
    expect(response.status()).toBe(200)
    return ((await response.json()) as { code: string }).code
}
