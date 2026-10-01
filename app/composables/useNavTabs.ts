export const useNavTabs = () => {
    const route = useRoute()
    const { currentId } = useCurrentMember()
    const { unreadCountFor } = useMessages()
    const { t } = useI18n()

    const tabs = computed(() => [
        {
            path: '/home',
            icon: 'book' as IconName,
            label: t('shell.nav.library'),
            isOn: route.path === '/home' || route.path.startsWith('/books'),
            hasBadge: false,
        },
        {
            path: '/messages',
            icon: 'message' as IconName,
            label: t('shell.nav.messages'),
            isOn: route.path === '/messages',
            hasBadge: currentId.value !== null && unreadCountFor(currentId.value) > 0,
        },
        {
            path: '/family',
            icon: 'users' as IconName,
            label: t('shell.nav.family'),
            isOn: route.path.startsWith('/family') || route.path === '/feedback',
            hasBadge: false,
        },
    ])

    return { tabs }
}
