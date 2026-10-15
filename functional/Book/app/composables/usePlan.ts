export const usePlan = () => {
    const { request } = useApi()
    const usage = useState<IPlanUsage | null>('plan-usage', () => null)

    const load = async (): Promise<void> => {
        try {
            usage.value = await request<IPlanUsage>('/plan')
        } catch (_error) {
            usage.value = null
        }
    }

    return { usage, load }
}
