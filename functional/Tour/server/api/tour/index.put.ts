import { getDb } from '~~/server/utils/db'
import { badRequest } from '~~/server/utils/validate'
import { readTourState, requireTourActor } from '../../utils/tour'

const STATUSES: ITourUpdate['status'][] = ['pending', 'done']

export default defineEventHandler(async (event): Promise<ITourState> => {
    const actor = await requireTourActor(event)
    const body = await readBody<Partial<ITourUpdate>>(event)
    const status = STATUSES.find(candidate => candidate === body.status)
    if (!status) {
        return badRequest('Invalid tour status')
    }
    await getDb()`update members set tour_status = ${status} where id = ${actor.id}`
    return readTourState(actor)
})
