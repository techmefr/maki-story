import { getDb, one } from '~~/server/utils/db'
import { actorEntry, record } from '~~/server/utils/journal'
import { ensureDefaultTags, writeTagNames } from '~~/server/utils/tags'
import { badRequest } from '~~/server/utils/validate'
import { requireRole } from '~~/technical/Auth/server/utils/permissions'

export default defineEventHandler(async (event): Promise<{ slug: string }> => {
    const actor = await requireRole(event, 'parent')
    const { familyId } = actor
    const body = await readBody<Partial<ITagInput>>(event)
    const input: ITagInput = { names: body.names ?? {}, color: body.color as VoiceColorId, icon: body.icon as TagIconId }
    await ensureDefaultTags(familyId)
    const db = getDb()
    const taken = await db<{ slug: string }[]>`select slug from tags where family_id = ${familyId}`
    if (taken.length >= MAX_TAGS_PER_FAMILY) {
        return badRequest('Too many tags')
    }
    const problem = checkTagInput(input, taken.map(row => row.slug))
    if (problem !== null) {
        return badRequest(problem)
    }
    const names = cleanTagNames(input.names)
    const slug = slugForNames(names)
    await db.begin(async tx => {
        const created = one(await tx<{ id: string }[]>`
            insert into tags (family_id, slug, color, icon) values (${familyId}, ${slug}, ${input.color}, ${input.icon}) returning id
        `)
        await writeTagNames(tx, created.id, familyId, names)
    })
    await record(event, { ...actorEntry(actor), action: 'tag.created', entityType: 'tag', entityId: slug })
    return { slug }
})
