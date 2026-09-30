export const useNavTabs = () => {
    const route = useRoute()
    const { currentId } = useCurrentMember()
    const { unreadCountFor } = useMessages()

    const tabs = computed(() => [
        {
            path: '/home',
            label: 'Bibliothèque',
            isOn: route.path === '/home' || route.path.startsWith('/books'),
            hasBadge: false,
        },
        {
            path: '/messages',
            label: 'Messages',
            isOn: route.path === '/messages',
            hasBadge: currentId.value !== null && unreadCountFor(currentId.value) > 0,
        },
        {
            path: '/family',
            label: 'Famille',
            isOn: route.path.startsWith('/family') || route.path === '/feedback',
            hasBadge: false,
        },
    ])

    return { tabs }
}
