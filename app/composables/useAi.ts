export const useAi = () => {
    const { request } = useApi()

    const aiStatus = useState<IAiStatus | null>('ai-status', () => null)

    const status = (): Promise<IAiStatus> => request<IAiStatus>('/ai/status')

    const refreshStatus = async (): Promise<void> => {
        try {
            aiStatus.value = await status()
        } catch (error) {
            console.error('Le budget IA n a pas pu être chargé', error)
            aiStatus.value = null
        }
    }

    const isExhausted = computed(() => aiStatus.value !== null && aiStatus.value.enabled && aiStatus.value.remainingUsd <= 0)
    const isUnavailable = computed(() => aiStatus.value !== null && !aiStatus.value.enabled)

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

    const saveTranslation = (bookId: string, lineId: string, language: string, text: string, tone: string): Promise<ILineTranslation> => {
        return request<ILineTranslation>(`/books/${bookId}/lines/${lineId}/translations/${language}`, { method: 'PUT', body: { text, tone } })
    }

    return { aiStatus, isExhausted, isUnavailable, refreshStatus, saveTranslation, status, prefillFromPhotos, generateBook, suggestTranslation, validateDraft }
}
