import { getDb } from '../../utils/db'

export default defineEventHandler(async (): Promise<IMember[]> => {
    return getDb()<IMember[]>`
        select id, name, role, color, photo_file_id from members order by created_at
    `
})
