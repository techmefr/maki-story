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
    const { isRelativeAccount } = useSession()
    const { t } = useI18n()

    const tabs = computed<INavTab[]>(() => {
        const role = current.value?.role
        if (role === 'child') {
            return [
                { path: '/kid', icon: 'home', label: t('shell.nav.home'), isOn: route.path.startsWith('/kid') && !route.path.startsWith('/kid/treasure') && !route.path.startsWith('/kid/library'), hasBadge: false },
                { path: '/kid/treasure', icon: 'heart', label: t('shell.nav.treasure'), isOn: route.path.startsWith('/kid/treasure'), hasBadge: false },
                { path: '/kid/library', icon: 'book', label: t('shell.nav.library'), isOn: route.path.startsWith('/kid/library'), hasBadge: false },
            ]
        }
        const home: INavTab = { path: '/home', icon: 'home', label: t('shell.nav.home'), isOn: route.path === '/home', hasBadge: false }
        const relative: INavTab = { path: '/relative', icon: 'heart', label: t('relative.nav'), isOn: route.path === '/relative', hasBadge: false }
        const own = isRelativeAccount.value ? [relative] : []
        if (role === 'parent') {
            return [
                home,
                { path: '/library', icon: 'book', label: t('shell.nav.library'), isOn: route.path === '/library' || route.path.startsWith('/books'), hasBadge: false },
                { path: '/family', icon: 'users', label: t('shell.nav.family'), isOn: route.path.startsWith('/family') || route.path === '/feedback', hasBadge: false },
                ...own,
            ]
        }
        return [home, ...own]
    })

    return { tabs }
}
