const BOOK_VALIDATE = /^\/api\/books\/[^/]+\/validate\/?$/

export default defineEventHandler(event => {
    const path = event.path.split('?')[0] ?? ''
    if (!path.startsWith('/api/ai/') && !BOOK_VALIDATE.test(path)) {
        return
    }
    if (useRuntimeConfig(event).public.aiCreationEnabled !== true) {
        throw createError({ statusCode: 404, statusMessage: 'Not found' })
    }
})
