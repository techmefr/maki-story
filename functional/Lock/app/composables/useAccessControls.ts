export const useAccessControls = () => {
    const { request } = useApi()

    const load = (memberId: string): Promise<IAccessControls> => request<IAccessControls>(`/members/${memberId}/access-controls`)

    const save = async (memberId: string, controls: IAccessControls): Promise<void> => {
        await request<IAccessControls>(`/members/${memberId}/access-controls`, { method: 'PUT', body: controls })
    }

    return { load, save }
}
