import { getDb } from '~~/server/utils/db'
import { requireInstanceAdmin } from '~~/server/utils/admin'
import { requireParam } from '~~/server/utils/validate'

export default defineEventHandler(async (event): Promise<{ ok: true }> => {
    await requireInstanceAdmin(event)
    const code = requireParam(event, 'code').toUpperCase()
    await getDb()`delete from promo_codes where code = ${code}`
    return { ok: true }
})
