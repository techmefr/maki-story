import { getDb } from '../../utils/db'
import { notFound, requireParam } from '../../utils/validate'

interface IFileRow {
    mime: string
    data: Buffer
}

export default defineEventHandler(async event => {
    const id = requireParam(event, 'id')
    const [file] = await getDb()<IFileRow[]>`select mime, data from files where id = ${id}`
    if (!file) {
        return notFound('File not found')
    }
    setResponseHeader(event, 'content-type', file.mime)
    setResponseHeader(event, 'cache-control', 'private, max-age=31536000, immutable')
    return file.data
})
