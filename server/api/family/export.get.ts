import { Readable } from 'node:stream'
import { familyExportEntries } from '../../utils/familyData'
import { actorEntry, record } from '../../utils/journal'
import { requirePermission } from '../../utils/permissions'
import { zipStream } from '../../utils/zip'

export default defineEventHandler(async event => {
    const actor = await requirePermission(event, 'family.export')
    await record(event, { ...actorEntry(actor), action: 'family.exported', entityType: 'family', entityId: actor.familyId })
    setResponseHeader(event, 'content-type', 'application/zip')
    setResponseHeader(event, 'content-disposition', 'attachment; filename="tantara-family-export.zip"')
    setResponseHeader(event, 'cache-control', 'no-store')
    return sendStream(event, Readable.from(zipStream(familyExportEntries(actor.familyId))))
})
