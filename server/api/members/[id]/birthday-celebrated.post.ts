import { getDb } from '../../../utils/db'
import { requireSettingsScope } from '../../../utils/settings'
import { badRequest, requireParam } from '../../../utils/validate'

const MIN_YEAR = 2000

export default defineEventHandler(async (event): Promise<{ ok: boolean }> => {
    const scope = await requireSettingsScope(event, requireParam(event, 'id'))
    const body = await readBody<{ year?: number }>(event)
    const maxYear = new Date().getUTCFullYear() + 1
    if (scope.targetRole !== 'child' || !Number.isInteger(body.year) || (body.year as number) < MIN_YEAR || (body.year as number) > maxYear) {
        return badRequest('Invalid birthday')
    }
    await getDb()`
        update members set birthday_celebrated_year = ${body.year as number}
        where id = ${scope.targetId} and family_id = ${scope.actor.familyId} and birth_date is not null
    `
    return { ok: true }
})
