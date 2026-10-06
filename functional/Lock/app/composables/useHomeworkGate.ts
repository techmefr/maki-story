export const useHomeworkGate = () => {
    const { request } = useApi()

    const loadFollow = async (memberId: string): Promise<boolean> => (await request<IHomeworkFollow>(`/members/${memberId}/homework-follow`)).isEnabled

    const saveFollow = async (memberId: string, isEnabled: boolean): Promise<void> => {
        await request<IHomeworkFollow>(`/members/${memberId}/homework-follow`, { method: 'PUT', body: { isEnabled } })
    }

    const loadPending = async (): Promise<IHomeworkRequest[]> => (await request<IHomeworkRequestList>('/homework/requests')).items

    const decide = async (requestId: string, decision: THomeworkDecision): Promise<void> => {
        await request<IHomeworkReply>(`/homework/requests/${requestId}`, { method: 'POST', body: { decision } })
    }

    const ask = async (): Promise<void> => {
        await request<IHomeworkReply>('/access/homework', { method: 'POST' })
    }

    return { loadFollow, saveFollow, loadPending, decide, ask }
}
