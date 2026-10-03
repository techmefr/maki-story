import { getDb } from '~~/server/utils/db'
import { actorEntry, record } from '~~/server/utils/journal'
import { writeTagNames } from '~~/server/utils/tags'
import { badRequest, notFound, requireParam } from '~~/server/utils/validate'
import { requireRole } from '~~/technical/Auth/server/utils/permissions'

export default defineEventHandler(async (event): Promise<{ slug: string }> => {
    const actor = await requireRole(event, 'parent')
    const { familyId } = actor
    const slug = requireParam(event, 'slug')
    const body = await readBody<Partial<ITagInput>>(event)
    const input: ITagInput = { names: body.names ?? {}, color: body.color as VoiceColorId, icon: body.icon as TagIconId }
    const problem = checkTagInput(input, [], slug)
    if (problem !== null) {
        return badRequest(problem)
    }
    const names = cleanTagNames(input.names)
    const db = getDb()
    await db.begin(async tx => {
        const [current] = await tx<{ id: string }[]>`select id from tags where family_id = ${familyId} and slug = ${slug} for update`
        if (!current) {
            return notFound('Tag not found')
        }
        await tx`update tags set color = ${input.color}, icon = ${input.icon} where id = ${current.id}`
        await writeTagNames(tx, current.id, familyId, names)
    })
    await record(event, { ...actorEntry(actor), action: 'tag.updated', entityType: 'tag', entityId: slug })
    return { slug }
})
