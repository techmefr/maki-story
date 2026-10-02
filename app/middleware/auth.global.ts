const PUBLIC_PATHS = ['/login', '/register']
const PARENT_ONLY_PREFIXES = ['/family', '/storage']
const CHILD_ALLOWED_PREFIXES = ['/kid', '/message/', '/profiles', '/grimace']

export default defineNuxtRouteMiddleware(async to => {
    if (import.meta.server) {
        return
    }
    const { check } = useSession()
    const isSignedIn = await check()
    if (!isSignedIn) {
        return PUBLIC_PATHS.includes(to.path) ? undefined : navigateTo('/login')
    }
    if (PUBLIC_PATHS.includes(to.path)) {
        return navigateTo('/profiles')
    }
    const { ensureLoaded, load, getById } = useMembers()
    await ensureLoaded()
    const { currentId, current, select, isChild, isParent } = useCurrentMember()
    if (to.path === '/profiles') {
        if (current.value?.role === 'relative') {
            await select(null)
        }
        await load()
    }
    if (currentId.value && !getById(currentId.value)) {
        await select(null)
    }
    if (to.path === '/profiles') {
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
