export const usePlaybackProgress = (bookId: string) => {
    const { request } = useApi()

    const load = async (): Promise<IPlaybackProgress | null> => {
        try {
            return (await request<IPlaybackProgress | null | undefined>(`/books/${bookId}/progress`)) ?? null
        } catch (error) {
            console.error('La reprise de lecture n a pas pu être chargée', error)
            return null
        }
    }

    const save = async (progress: IPlaybackProgress): Promise<void> => {
        try {
            await request(`/books/${bookId}/progress`, { method: 'PUT', body: progress })
        } catch (error) {
            console.error('La position de lecture n a pas pu être enregistrée', error)
        }
    }

    const clear = async (): Promise<void> => {
        try {
            await request(`/books/${bookId}/progress`, { method: 'DELETE' })
        } catch (error) {
            console.error('La position de lecture n a pas pu être effacée', error)
        }
    }

    return { load, save, clear }
}
