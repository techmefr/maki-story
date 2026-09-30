const PUBLIC_PATHS = ['/login']
const CHILD_ALLOWED_PREFIXES = ['/kid', '/message', '/profiles', '/grimace']

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
    const { ensureLoaded, getById } = useMembers()
    await ensureLoaded()
    const { currentId, select, isChild } = useCurrentMember()
    if (currentId.value && !getById(currentId.value)) {
        select(null)
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
    if (to.path === '/') {
        return navigateTo(isChild.value ? '/kid' : '/home')
    }
})
