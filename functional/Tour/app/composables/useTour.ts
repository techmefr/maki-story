export const useTour = () => {
    const { request } = useApi()
    const isRequested = useState<boolean>('tour-requested', () => false)
    const isRunning = useState<boolean>('tour-running', () => false)

    const load = (): Promise<ITourState> => request<ITourState>('/tour')

    const save = (status: ITourUpdate['status']): Promise<ITourState> => request<ITourState>('/tour', { method: 'PUT', body: { status } })

    const arm = (): Promise<ITourState> => save('pending')

    const finish = (): Promise<ITourState> => save('done')

    const replay = (): void => {
        isRequested.value = true
    }

    return { isRequested, isRunning, load, arm, finish, replay }
}
