export const useProfileUnlockers = () => {
    const unlockers = useState<IProfileUnlocker[]>('profile-unlockers', () => [])

    const register = (unlocker: IProfileUnlocker): void => {
        unlockers.value = [...unlockers.value.filter(item => item.id !== unlocker.id), unlocker]
    }

    return { unlockers, register }
}
