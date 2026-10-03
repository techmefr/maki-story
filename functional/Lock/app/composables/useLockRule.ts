export const useLockRule = () => {
    const { load, save } = useParental()
    const { children, load: loadMembers } = useMembers()

    const selectedId = ref<string | null>(null)
    const rules = ref<Record<string, ILockRule>>({})
    const isBusy = ref(false)
    const isSaved = ref(false)
    const hasFailed = ref(false)

    const rule = computed<ILockRule | null>(() => (selectedId.value ? (rules.value[selectedId.value] ?? null) : null))

    const select = async (id: string): Promise<void> => {
        selectedId.value = id
        isSaved.value = false
        if (rules.value[id]) {
            return
        }
        try {
            rules.value = { ...rules.value, [id]: weeklyToRule(await load(id)) }
        } catch (_error) {
            hasFailed.value = true
        }
    }

    const patch = (changes: Partial<ILockRule>): void => {
        const current = rule.value
        if (!current || !selectedId.value) {
            return
        }
        isSaved.value = false
        rules.value = { ...rules.value, [selectedId.value]: { ...current, ...changes } }
    }

    const toggleDay = (day: number): void => {
        const current = rule.value
        if (!current) {
            return
        }
        patch({ days: current.days.includes(day) ? current.days.filter(item => item !== day) : [...current.days, day].sort((a, b) => a - b) })
    }

    const step = (key: 'from' | 'to', direction: 1 | -1): void => {
        const current = rule.value
        if (current) {
            patch({ [key]: stepMinutes(current[key], direction) })
        }
    }

    const persist = async (): Promise<void> => {
        const current = rule.value
        if (!current || !selectedId.value) {
            return
        }
        isBusy.value = true
        hasFailed.value = false
        try {
            await save(selectedId.value, {
                isEnabled: current.isEnabled,
                weekly: ruleToWeekly(current),
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            })
            isSaved.value = true
        } catch (_error) {
            hasFailed.value = true
        } finally {
            isBusy.value = false
        }
    }

    const init = async (): Promise<void> => {
        await loadMembers()
        const first = children.value[0]
        if (first) {
            await select(first.id)
        }
    }

    return { children, selectedId, rule, isBusy, isSaved, hasFailed, init, select, patch, toggleDay, step, persist }
}
