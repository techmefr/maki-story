import { getDb } from '../../utils/db'
import { assertFileReadable } from '../../utils/files'
import { requirePermission } from '../../utils/permissions'
import { notFound, requireParam } from '../../utils/validate'

interface IFileRow {
    mime: string
    data: Buffer
}

export default defineEventHandler(async event => {
    const actor = await requirePermission(event, 'files.read')
    const id = requireParam(event, 'id')
    const [file] = await getDb()<IFileRow[]>`select mime, data from files where id = ${id} and family_id = ${actor.familyId}`
    if (!file) {
        return notFound('File not found')
    }
    await assertFileReadable(actor, id)
    setResponseHeader(event, 'content-type', file.mime)
    setResponseHeader(event, 'cache-control', 'private, max-age=31536000, immutable')
    return file.data
})
