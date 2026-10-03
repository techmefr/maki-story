export const useRelativeFlow = () => {
    const { request } = useApi()
    const flow = useState<IRelativeFlow>('relative-flow', () => ({ families: [], currentFamilyId: '' }))
    const isLoaded = useState<boolean>('relative-flow-loaded', () => false)

    const load = async (): Promise<void> => {
        flow.value = await request<IRelativeFlow>('/relative/flow')
        isLoaded.value = true
    }

    return { flow, isLoaded, load }
}
