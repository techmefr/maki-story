import { getDb, one } from '../../utils/db'
import { normalizeInviteCode } from '../../utils/inviteCode'
import { actorEntry, record } from '../../utils/journal'
import { logEvent } from '../../utils/log'
import { requireActorMember, requireAnyPermission } from '../../utils/permissions'
import { assertRoomForFamily, bookTitle, familyName, memberName, notifyParents } from '../../utils/shares'
import { assertIpBudget, recordIpHit } from '../../utils/throttle'
import { badRequest, isNonEmptyString, notFound } from '../../utils/validate'

const MAX_MESSAGE_LENGTH = 200
const MAX_SHARED_LINES = 400
const INVITE_LOOKUPS_PER_WINDOW = 20
const SHARE_MODES: ShareMode[] = ['record', 'copy']

export default defineEventHandler(async (event): Promise<{ id: string; status: ShareStatus; targetFamilyName: string }> => {
    const actor = await requireAnyPermission(event, 'shares.create', 'shares.propose')
    const { familyId } = actor
    const proposerId = actor.role === 'relative' ? requireActorMember(actor) : null
    const body = await readBody<Partial<IShareInput>>(event)
    if (!isNonEmptyString(body.bookId) || !SHARE_MODES.includes(body.mode as ShareMode)) {
        return badRequest('A book and a sharing mode are required')
    }
    const mode = body.mode as ShareMode
    const message = typeof body.message === 'string' ? body.message.trim().slice(0, MAX_MESSAGE_LENGTH) : ''
    await assertIpBudget(event, 'invite-code', INVITE_LOOKUPS_PER_WINDOW)
    const db = getDb()
    const [target] = await db<{ id: string; name: string }[]>`
        select id, name from families
        where invite_code = ${normalizeInviteCode(body.code)} and invite_revoked_at is null and deleted_at is null
    `
    if (!target) {
        await recordIpHit(event, 'invite-code')
        return notFound('Unknown invite code')
    }
    if (target.id === familyId) {
        return badRequest('Choose another family')
    }
    const [book] = await db<{ id: string; kind: BookKind; soloMemberId: string | null; originBookId: string | null; originFamilyId: string | null }[]>`
        select id, kind, solo_member_id, origin_book_id, origin_family_id from books
        where id = ${body.bookId} and family_id = ${familyId} and deleted_at is null
    `
    if (!book) {
        return notFound('Book not found')
    }
    if (proposerId !== null && !(book.kind === 'solo' && book.soloMemberId === proposerId)) {
        throw createError({ statusCode: 403, statusMessage: 'A relative can only propose their own single voice books' })
    }
    const lineIds = [...new Set(Array.isArray(body.lineIds) ? body.lineIds.filter(isNonEmptyString) : [])]
    if (mode === 'record') {
        if (lineIds.length === 0 || lineIds.length > MAX_SHARED_LINES) {
            return badRequest('Choose the lines to record')
        }
        const found = await db<{ id: string }[]>`select id from lines where book_id = ${book.id} and family_id = ${familyId} and id in ${db(lineIds)}`
        if (found.length !== lineIds.length) {
            return badRequest('Unknown line')
        }
    }
    const rootBookId = book.originBookId ?? book.id
    const isReshare = book.originFamilyId !== null
    const status: ShareStatus = proposerId !== null ? 'proposed' : isReshare ? 'awaiting_owner' : 'pending'
    const approverFamilyId = proposerId !== null ? familyId : isReshare ? book.originFamilyId : null
    const share = await db.begin(async tx => {
        await assertRoomForFamily(tx, rootBookId, target.id)
        const created = one(await tx<{ id: string }[]>`
            insert into book_shares (book_id, root_book_id, owner_family_id, target_family_id, approver_family_id, mode, status, proposed_by_member_id, message)
            values (${book.id}, ${rootBookId}, ${familyId}, ${target.id}, ${approverFamilyId}, ${mode}, ${status}, ${proposerId}, ${message})
            returning id
        `)
        if (mode === 'record') {
            await tx`insert into share_lines (share_id, line_id) select ${created.id}, id from lines where id in ${tx(lineIds)}`
        }
        return created
    }).catch(error => {
        if ((error as { code?: string }).code === '23505') {
            throw createError({ statusCode: 409, statusMessage: 'This book is already shared this way with this family' })
        }
        throw error
    })
    const title = await bookTitle(db, book.id)
    const senderName = await memberName(db, actor.memberId)
    const ownName = await familyName(db, familyId)
    if (status === 'pending') {
        await notifyParents(db, target.id, 'share_received', { fromName: senderName, familyName: ownName, bookTitle: title, mode })
    } else if (approverFamilyId !== null) {
        await notifyParents(db, approverFamilyId, 'share_to_approve', { fromName: senderName, familyName: ownName, bookTitle: title, mode })
    }
    await record(event, { ...actorEntry(actor), action: 'share.created', entityType: 'share', entityId: share.id })
    logEvent('Partage de livre créé')
    return { id: share.id, status, targetFamilyName: target.name }
})
