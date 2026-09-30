import { request } from '@playwright/test'
import { E2E_EMAIL, E2E_PASSWORD } from './helpers'

interface INamed {
    id: string
    name?: string
    title?: string
    text?: string
}

const TEST_SUFFIXES = ['-mobile', '-desktop', ' mobile', ' desktop']
const isTestLabel = (label: string | undefined): boolean => {
    return label !== undefined && TEST_SUFFIXES.some(suffix => label.endsWith(suffix))
}

export default async function globalTeardown(): Promise<void> {
    const baseURL = process.env.E2E_BASE_URL
    if (!baseURL) {
        return
    }
    const api = await request.newContext({ baseURL })
    try {
        await api.post('/api/auth/login', { data: { email: E2E_EMAIL, password: E2E_PASSWORD } })
        const members = (await (await api.get('/api/members')).json()) as INamed[]
        const books = (await (await api.get('/api/books')).json()) as INamed[]
        const feedback = (await (await api.get('/api/feedback')).json()) as INamed[]
        for (const member of members.filter(item => isTestLabel(item.name))) {
            await api.delete(`/api/members/${member.id}`)
        }
        for (const book of books.filter(item => isTestLabel(item.title) || item.title === 'A supprimer')) {
            await api.delete(`/api/books/${book.id}`)
        }
        for (const entry of feedback.filter(item => item.text?.startsWith('Super écran'))) {
            await api.delete(`/api/feedback/${entry.id}`)
        }
    } finally {
        await api.dispose()
    }
}
