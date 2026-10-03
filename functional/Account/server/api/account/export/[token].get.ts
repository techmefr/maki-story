import { Readable } from 'node:stream'
import { getDb } from '~~/server/utils/db'
import { familyExportEntries } from '~~/server/utils/familyData'
import { requireParam } from '~~/server/utils/validate'
import { assertIpBudget, recordIpHit } from '~~/technical/Auth/server/utils/throttle'
import { zipStream } from '~~/technical/Upload/server/utils/zip'
import { hashMagicToken } from '../../../utils/magicLink'

const IP_BUDGET = 20

export default defineEventHandler(async event => {
    await assertIpBudget(event, 'export-download', IP_BUDGET)
    await recordIpHit(event, 'export-download')
    const token = requireParam(event, 'token')
    const [link] = await getDb()<{ familyId: string }[]>`
        select l.family_id from export_links l join families f on f.id = l.family_id and f.deleted_at is null
        where l.token_hash = ${hashMagicToken(token)} and l.expires_at > now()
    `
    if (!link) {
        throw createError({ statusCode: 410, statusMessage: 'This export link has expired' })
    }
    setResponseHeader(event, 'content-type', 'application/zip')
    setResponseHeader(event, 'content-disposition', 'attachment; filename="tantara-family-export.zip"')
    setResponseHeader(event, 'cache-control', 'no-store')
    return sendStream(event, Readable.from(zipStream(familyExportEntries(link.familyId))))
})
