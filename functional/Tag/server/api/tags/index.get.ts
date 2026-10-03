import { ensureDefaultTags, listTags } from '~~/server/utils/tags'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'

export default defineEventHandler(async (event): Promise<ITag[]> => {
    const { familyId } = await requirePermission(event, 'books.list')
    await ensureDefaultTags(familyId)
    return listTags(familyId)
})
