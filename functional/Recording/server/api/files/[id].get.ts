import { getDb } from '~~/server/utils/db'
import { assertFileReadable } from '~~/server/utils/files'
import { requirePermission } from '~~/server/utils/permissions'
import { badRequest, notFound, requireParam } from '~~/server/utils/validate'

interface IFileRow {
    mime: string
    data: Buffer
}

export default defineEventHandler(async event => {
    const actor = await requirePermission(event, 'files.read')
    const id = requireParam(event, 'id')
    const { size } = getQuery(event)
    if (size !== undefined && size !== 'full') {
        return badRequest('Invalid size')
    }
    const [file] = await getDb()<IFileRow[]>`select mime, data from files where id = ${id} and family_id = ${actor.familyId}`
    if (!file) {
        return notFound('File not found')
    }
    await assertFileReadable(actor, id)
    setResponseHeader(event, 'content-type', file.mime)
    setResponseHeader(event, 'cache-control', 'private, max-age=31536000, immutable')
    return file.data
})
