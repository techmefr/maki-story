export const useFeedback = () => {
    const { request } = useApi()

    const send = (input: INewFeedback): Promise<{ ok: boolean }> => {
        return request<{ ok: boolean }>('/feedback', { method: 'POST', body: input })
    }

    const list = (): Promise<IFeedback[]> => request<IFeedback[]>('/feedback')

    return { send, list }
}
