const PUBLIC_PATHS = ['/login', '/register', '/magic']
const OPEN_PREFIXES = ['/join', '/legal', '/forgot', '/onboarding']
const RELATIVE_LANDING = '/relative'
const PARENT_ONLY_PREFIXES = ['/family']
const CHILD_ALLOWED_PREFIXES = ['/kid', '/message/', '/profiles', '/grimace']

export default defineNuxtRouteMiddleware(async to => {
    if (import.meta.server) {
        return
    }
    if (OPEN_PREFIXES.some(prefix => to.path === prefix || to.path.startsWith(`${prefix}/`))) {
        return
    }
    const { check, isRelativeAccount } = useSession()
    const isSignedIn = await check()
    if (!isSignedIn) {
        if (PUBLIC_PATHS.includes(to.path)) {
            return undefined
        }
        return navigateTo(to.path === '/' && !hasSeenOnboarding() ? '/onboarding' : '/login')
    }
    if (PUBLIC_PATHS.includes(to.path)) {
        return navigateTo(isRelativeAccount.value ? RELATIVE_LANDING : '/profiles')
    }
    const { ensureLoaded, load, getById } = useMembers()
    await ensureLoaded()
    const { currentId, current, select, isChild, isParent } = useCurrentMember()
    if (isRelativeAccount.value && (to.path === '/profiles' || to.path === '/')) {
        return navigateTo(RELATIVE_LANDING)
    }
    const personal = usePersonalDevice()
    const personalDevice = personal.stored.value
    const isPersonalLocked = personalDevice !== null && !isRelativeAccount.value && !personal.isReleased.value
    if (isPersonalLocked && currentId.value !== personalDevice.memberId) {
        try {
            await select(personalDevice.memberId, { device: { id: personalDevice.id, secret: personalDevice.secret } })
        } catch (error) {
            const status = (error as { statusCode?: number }).statusCode
            if (status === 403 || status === 404) {
                personal.forget()
            }
        }
    }
    if (isPersonalLocked && personal.isPersonal.value && currentId.value === personalDevice.memberId) {
        if (to.path === '/profiles') {
            return navigateTo('/home')
        }
        if (PARENT_ONLY_PREFIXES.some(prefix => to.path.startsWith(prefix))) {
            personal.gateNext.value = to.path
            useState<boolean>('switcher-open', () => false).value = true
            return navigateTo('/home')
        }
    }
    if (to.path === '/profiles') {
        if (current.value?.role === 'relative') {
            await select(null)
        }
        await load()
    }
    if (currentId.value && !getById(currentId.value)) {
        await select(null)
    }
    if (to.path === '/profiles' || to.path.startsWith('/families') || to.path.startsWith('/welcome')) {
        return
    }
    if (!currentId.value) {
        return navigateTo('/profiles')
    }
    const isAllowedForChild = CHILD_ALLOWED_PREFIXES.some(prefix => to.path.startsWith(prefix))
    if (isChild.value && !isAllowedForChild) {
        return navigateTo('/kid')
    }
    if (!isParent.value && !isChild.value && PARENT_ONLY_PREFIXES.some(prefix => to.path.startsWith(prefix))) {
        return navigateTo('/home')
    }
    if (isChild.value) {
        const { isAllowed } = await useAccess().refresh()
        if (!isAllowed && to.path !== '/kid/locked') {
            return navigateTo('/kid/locked')
        }
        if (isAllowed && to.path === '/kid/locked') {
            return navigateTo('/kid')
        }
    }
    if (to.path === '/') {
        return navigateTo(isChild.value ? '/kid' : '/home')
    }
})
