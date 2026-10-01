export const useAi = () => {
    const { request } = useApi()

    const status = (): Promise<IAiStatus> => request<IAiStatus>('/ai/status')

    const prefillFromPhotos = (body: IAiPhotoPrefillBody): Promise<IAiPhotoPrefillResult> => {
        return request<IAiPhotoPrefillResult>('/ai/photo-prefill', { method: 'POST', body })
    }

    const generateBook = (body: IAiBookGenerationBody): Promise<IAiBookGenerationResult> => {
        return request<IAiBookGenerationResult>('/ai/book-generation', { method: 'POST', body })
    }

    const suggestTranslation = (body: IAiTranslationBody): Promise<IAiTranslationResult> => {
        return request<IAiTranslationResult>('/ai/translation', { method: 'POST', body })
    }

    const validateDraft = (bookId: string): Promise<IBook> => request<IBook>(`/books/${bookId}/validate`, { method: 'POST' })

    return { status, prefillFromPhotos, generateBook, suggestTranslation, validateDraft }
}
