const ISBN_PATTERN = /^(?:\d{9}[\dX]|\d{13})$/
const LOOKUP_TIMEOUT_MS = 8000
const MAX_SUBJECTS = 12

interface IOpenLibraryRecord {
    title?: string
    authors?: { name?: string }[]
    subjects?: { name?: string }[]
    cover?: { medium?: string; large?: string }
}

export const normalizeIsbn = (value: unknown): string | null => {
    const compact = typeof value === 'string' ? value.replace(/[\s-]/g, '').toUpperCase() : ''
    return ISBN_PATTERN.test(compact) ? compact : null
}

export const lookupIsbn = async (isbn: string): Promise<IIsbnBook | null> => {
    const url = `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
    const response = await fetch(url, { signal: AbortSignal.timeout(LOOKUP_TIMEOUT_MS), headers: { accept: 'application/json' } })
    if (!response.ok) {
        throw createError({ statusCode: 502, statusMessage: 'The book catalog is unavailable' })
    }
    const payload = (await response.json()) as Record<string, IOpenLibraryRecord>
    const record = payload[`ISBN:${isbn}`]
    if (!record || typeof record.title !== 'string' || record.title.trim() === '') {
        return null
    }
    return {
        isbn,
        title: record.title.trim(),
        author: (record.authors ?? []).map(author => author.name?.trim() ?? '').filter(name => name !== '').join(', '),
        subjects: (record.subjects ?? []).map(subject => subject.name?.trim() ?? '').filter(name => name !== '').slice(0, MAX_SUBJECTS),
        coverUrl: record.cover?.medium ?? record.cover?.large ?? null,
    }
}
