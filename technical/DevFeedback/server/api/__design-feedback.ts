import { feedbackFile, nextId, readItems, writeItems, type FeedbackItem } from '../utils/feedbackStore'

const MAX_COMMENT = 4000

export default defineEventHandler(async event => {
    if (useRuntimeConfig(event).public.appEnv !== 'development-local') {
        throw createError({ statusCode: 404 })
    }
    const file = await feedbackFile()
    const items = await readItems(file)

    if (event.method === 'GET') {
        return items
    }
    if (event.method === 'POST') {
        const body = await readBody<Partial<FeedbackItem>>(event)
        if (!body?.comment || typeof body.comment !== 'string') {
            throw createError({ statusCode: 400, statusMessage: 'comment is required' })
        }
        const item: FeedbackItem = {
            id: nextId(items),
            createdAt: new Date().toISOString(),
            status: 'todo',
            comment: body.comment.slice(0, MAX_COMMENT),
            category: body.category,
            route: body.route,
            target: body.target ?? null,
        }
        await writeItems(file, [...items, item])
        return item
    }
    if (event.method === 'DELETE') {
        const id = getQuery(event).id
        await writeItems(file, items.filter(item => item.id !== id))
        return { ok: true }
    }
    throw createError({ statusCode: 405 })
})
