export const usePlaybackLanguages = (bookId: string) => {
    const { request } = useApi()

    const loadPlan = (languages: string[] | null = null): Promise<IPlaybackPlan> => {
        const query = languages ? `?languages=${languages.join(',')}` : ''
        return request<IPlaybackPlan>(`/books/${bookId}/playback${query}`)
    }

    const saveConfig = (memberId: string, languages: string[], scopeBookId: string | null = bookId): Promise<ILanguageConfig> => {
        return request<ILanguageConfig>(`/members/${memberId}/language-config`, {
            method: 'PUT',
            body: { bookId: scopeBookId, languages },
        })
    }

    const setLock = (memberId: string, isLocked: boolean, proof: { parentId?: string; code?: string } = {}, scopeBookId: string | null = bookId): Promise<ILanguageConfig> => {
        return request<ILanguageConfig>(`/members/${memberId}/language-lock`, {
            method: 'PUT',
            body: { bookId: scopeBookId, isLocked, ...proof },
        })
    }

    return { loadPlan, saveConfig, setLock }
}
