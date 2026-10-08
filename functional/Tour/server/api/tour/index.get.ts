import { readTourState, requireTourActor } from '../../utils/tour'

export default defineEventHandler(async (event): Promise<ITourState> => {
    return readTourState(await requireTourActor(event))
})
