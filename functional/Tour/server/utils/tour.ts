import type { H3Event } from 'h3'
import { getDb } from '~~/server/utils/db'
import { requireActor } from '~~/technical/Auth/server/utils/profile-code'

export interface ITourActor {
    id: string
    audience: TourAudience
}

export const requireTourActor = async (event: H3Event): Promise<ITourActor> => {
    const actor = await requireActor(event)
    if (actor.role === 'child') {
        throw createError({ statusCode: 403, statusMessage: 'The guided tour is for adults only' })
    }
    return { id: actor.id, audience: actor.role === 'parent' ? 'parent' : 'relative' }
}

export const readTourState = async (actor: ITourActor): Promise<ITourState> => {
    const [row] = await getDb()<{ tourStatus: 'pending' | 'done' | null }[]>`
        select tour_status from members where id = ${actor.id}
    `
    return { status: row?.tourStatus ?? 'none', audience: actor.audience }
}
