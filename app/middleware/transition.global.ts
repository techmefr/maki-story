const depthOf = (path: string): number => path.split('/').filter(Boolean).length

export default defineNuxtRouteMiddleware((to, from) => {
    const change = depthOf(to.path) - depthOf(from.path)
    const name = change > 0 ? 'slide-forward' : change < 0 ? 'slide-back' : 'page'
    to.meta.pageTransition = { name, mode: 'out-in' }
})
