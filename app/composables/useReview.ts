export const useReview = () => {
    const { request } = useApi()

    const submit = (bookId: string): Promise<ISubmitResult> => request<ISubmitResult>(`/books/${bookId}/submit`, { method: 'POST', body: {} })

    const reviewLine = (bookId: string, lineId: string, body: IReviewActionBody): Promise<{ status: RecordingStatus; isBookReady: boolean }> => {
        return request(`/books/${bookId}/lines/${lineId}/review`, { method: 'POST', body })
    }

    const validateAll = (bookId: string): Promise<IBook> => request<IBook>(`/books/${bookId}/validate-all`, { method: 'POST', body: {} })

    const loadComments = (bookId: string): Promise<IReviewComment[]> => request<IReviewComment[]>(`/books/${bookId}/comments`)

    const loadActivity = (bookId: string): Promise<IBookActivity> => request<IBookActivity>(`/books/${bookId}/activity`)

    const markSeen = async (bookId: string): Promise<void> => {
        await request(`/books/${bookId}/seen`, { method: 'POST', body: {} })
    }

    const loadNewVoices = (): Promise<INewVoices[]> => request<INewVoices[]>('/activity/new-voices')

    return { submit, reviewLine, validateAll, loadComments, loadActivity, markSeen, loadNewVoices }
}
