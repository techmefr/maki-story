interface INavTab {
    path: string
    icon: IconName
    label: string
    isOn: boolean
    hasBadge: boolean
}

export const useNavTabs = () => {
    const route = useRoute()
    const { current } = useCurrentMember()
    const { t } = useI18n()

    const tabs = computed<INavTab[]>(() => {
        const role = current.value?.role
        if (role === 'child') {
            return [
                { path: '/kid', icon: 'home', label: t('shell.nav.home'), isOn: route.path.startsWith('/kid') && !route.path.startsWith('/kid/treasure'), hasBadge: false },
                { path: '/kid/treasure', icon: 'heart', label: t('shell.nav.treasure'), isOn: route.path.startsWith('/kid/treasure'), hasBadge: false },
            ]
        }
        const home: INavTab = { path: '/home', icon: 'home', label: t('shell.nav.home'), isOn: route.path === '/home', hasBadge: false }
        if (role === 'parent') {
            return [
                home,
                {
                    path: '/library',
                    icon: 'book',
                    label: t('shell.nav.library'),
                    isOn: route.path === '/library' || route.path.startsWith('/books'),
                    hasBadge: false,
                },
                {
                    path: '/family',
                    icon: 'users',
                    label: t('shell.nav.family'),
                    isOn: route.path.startsWith('/family') || route.path === '/feedback',
                    hasBadge: false,
                },
            ]
        }
        return [home]
    })

    return { tabs }
}
