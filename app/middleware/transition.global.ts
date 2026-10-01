const READER_PATTERN = /^\/(kid\/listen|books\/[^/]+\/play)(\/|$)/

const depthOf = (path: string): number => path.split('/').filter(Boolean).length

export default defineNuxtRouteMiddleware((to, from) => {
    const opening = READER_PATTERN.test(to.path) && !READER_PATTERN.test(from.path)
    const closing = READER_PATTERN.test(from.path) && !READER_PATTERN.test(to.path)
    const kind = opening ? 'book-open' : closing ? 'book-close' : 'bars'
    useState<string>('transition-kind').value = kind
    const change = depthOf(to.path) - depthOf(from.path)
    const name = opening ? 'book-open' : closing ? 'book-close' : change > 0 ? 'slide-forward' : change < 0 ? 'slide-back' : 'page'
    to.meta.pageTransition = { name, mode: 'out-in' }
})
