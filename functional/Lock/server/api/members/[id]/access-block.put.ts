import { writeAudit } from '~~/server/utils/audit'
import { getDb } from '~~/server/utils/db'
import { saveManualBlock } from '~~/server/utils/parental'
import { requirePermission } from '~~/technical/Auth/server/utils/permissions'
import { loadCodeRow } from '~~/technical/Auth/server/utils/profile-code'
import { badRequest, notFound, requireParam } from '~~/server/utils/validate'

const MODES: TAccessBlockMode[] = ['now', 'until', 'clear']
const MAX_BLOCK_MS = 7 * 24 * 60 * 60 * 1000

export default defineEventHandler(async event => {
    const actor = await requirePermission(event, 'members.schedule.manage')
    const id = requireParam(event, 'id')
    const body = await readBody<Partial<IAccessBlockInput>>(event)
    if (!MODES.includes(body.mode as TAccessBlockMode)) {
        return badRequest('Invalid mode')
    }
    let until: Date | null = null
    if (body.mode === 'until') {
        until = new Date(typeof body.until === 'string' ? body.until : '')
        if (Number.isNaN(until.getTime()) || until.getTime() <= Date.now() || until.getTime() - Date.now() > MAX_BLOCK_MS) {
            return badRequest('Invalid end time')
        }
    }
    const db = getDb()
    const target = await loadCodeRow(db, actor.familyId, id)
    if (!target) {
        return notFound('Member not found')
    }
    if (target.role !== 'child') {
        return badRequest('Only a child profile can be disabled')
    }
    await saveManualBlock(db, actor.familyId, target.id, body.mode !== 'clear', until)
    await writeAudit(db, {
        familyId: actor.familyId,
        actorId: actor.memberId,
        targetId: target.id,
        action: 'member.access.block',
        details: { mode: body.mode, until: until ? until.toISOString() : null },
    })
    return { ok: true }
})
