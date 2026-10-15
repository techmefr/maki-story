import { getDb } from '~~/server/utils/db'
import { requireInstanceAdmin } from '~~/server/utils/admin'
import { logEvent } from '~~/server/utils/log'
import { badRequest, notFound, requireParam } from '~~/server/utils/validate'

const PLANS = ['free', 'premium', 'lifetime']

export default defineEventHandler(async (event): Promise<{ id: string; plan: string }> => {
    await requireInstanceAdmin(event)
    const id = requireParam(event, 'id')
    const body = await readBody<{ plan?: string }>(event)
    if (typeof body.plan !== 'string' || !PLANS.includes(body.plan)) {
        return badRequest('Invalid plan')
    }
    const [family] = await getDb()<{ id: string; plan: string }[]>`
        update families set plan = ${body.plan} where id = ${id} and deleted_at is null returning id, plan
    `
    if (!family) {
        return notFound('Family not found')
    }
    logEvent(`Offre de la famille changée : ${family.plan}`)
    return family
})
