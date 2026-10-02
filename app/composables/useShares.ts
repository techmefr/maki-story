export const useShares = () => {
    const { request } = useApi()
    const lists = useState<IShareLists>('shares', () => ({ outgoing: [], incoming: [], approvals: [] }))
    const invite = useState<IFamilyInvite | null>('family-invite', () => null)

    const load = async (): Promise<void> => {
        lists.value = await request<IShareLists>('/shares')
    }

    const create = (input: IShareInput): Promise<{ id: string; status: ShareStatus; targetFamilyName: string }> => {
        return request('/shares', { method: 'POST', body: input })
    }

    const act = async (id: string, action: 'approve' | 'accept' | 'decline', body: object = {}): Promise<void> => {
        await request(`/shares/${id}/${action}`, { method: 'POST', body })
        await load()
    }

    const stop = async (id: string): Promise<void> => {
        await request(`/shares/${id}`, { method: 'DELETE' })
        await load()
    }

    const loadInvite = async (): Promise<void> => {
        invite.value = await request<IFamilyInvite>('/family/invite')
    }

    const rotateInvite = async (): Promise<void> => {
        invite.value = await request<IFamilyInvite>('/family/invite/rotate', { method: 'POST' })
    }

    const revokeInvite = async (): Promise<void> => {
        await request('/family/invite', { method: 'DELETE' })
        await loadInvite()
    }

    const getBook = (id: string, language?: string): Promise<IShareBook> => {
        return request<IShareBook>(`/shares/${id}/book${language ? `?language=${encodeURIComponent(language)}` : ''}`)
    }

    const putLine = async (shareId: string, lineId: string, fileId: string, ms: number, language: string): Promise<void> => {
        await request(`/shares/${shareId}/lines/${lineId}/audio`, { method: 'PUT', body: { fileId, ms, language } })
    }

    return { lists, invite, load, create, act, stop, loadInvite, rotateInvite, revokeInvite, getBook, putLine }
}
