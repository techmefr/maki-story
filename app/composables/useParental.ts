export const useParental = () => {
    const { request } = useApi()

    const load = (memberId: string): Promise<IChildSchedule> => request<IChildSchedule>(`/members/${memberId}/schedule`)

    const save = async (memberId: string, input: IScheduleInput): Promise<void> => {
        await request(`/members/${memberId}/schedule`, { method: 'PUT', body: input })
    }

    const block = async (memberId: string, input: IAccessBlockInput): Promise<void> => {
        await request(`/members/${memberId}/access-block`, { method: 'PUT', body: input })
    }

    return { load, save, block }
}
