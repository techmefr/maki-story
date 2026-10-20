import { DEMO_FAMILY, DEMO_PROFILES } from '~~/shared/utils/demo'
import { getDb } from '~~/server/utils/db'
import { assertLocalDemo } from '../../utils/demo'

export default defineEventHandler(async event => {
    assertLocalDemo(event)
    const rows = await getDb()<{ id: string }[]>`select id from members where family_id = ${DEMO_FAMILY} and status = 'active' and deleted_at is null`
    const ids = new Set(rows.map(row => row.id))
    return DEMO_PROFILES.filter(profile => ids.has(profile.id)).map(({ id, name, role }) => ({ id, name, role }))
})
