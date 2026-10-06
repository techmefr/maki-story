import { getDb } from '~~/server/utils/db'
import { listTrash } from '~~/server/utils/trash'
import { requireActorMember, requirePermission } from '~~/technical/Auth/server/utils/permissions'

interface IBookCountRow {
    proposals: number
    drafts: number
    to_record: number
    in_review: number
    recorded: number
}

interface IRelativeCountRow {
    proposed_by_me: number
    proposals_waiting: number
    requests: number
    to_fix: number
}

const EMPTY: IHomeCounts = { proposals: 0, drafts: 0, toRecord: 0, inReview: 0, recorded: 0, trash: 0, proposedByMe: 0, requests: 0, proposalsWaiting: 0, toFix: 0 }

export default defineEventHandler(async (event): Promise<IHomeCounts> => {
    const actor = await requirePermission(event, 'books.list')
    const db = getDb()
    if (actor.role === 'parent') {
        const [row] = await db<IBookCountRow[]>`
            select
                count(*) filter (where status = 'proposed')::int as proposals,
                count(*) filter (where status = 'draft')::int as drafts,
                count(*) filter (where status = 'to_record')::int as to_record,
                count(*) filter (where status = 'in_review')::int as in_review,
                count(*) filter (where status = 'ready')::int as recorded
            from books where family_id = ${actor.familyId} and deleted_at is null
        `
        const trash = await listTrash(db, actor.familyId)
        return {
            ...EMPTY,
            proposals: row?.proposals ?? 0,
            drafts: row?.drafts ?? 0,
            toRecord: row?.to_record ?? 0,
            inReview: row?.in_review ?? 0,
            recorded: row?.recorded ?? 0,
            trash: trash.length,
        }
    }
    if (actor.role !== 'relative') {
        return EMPTY
    }
    const memberId = requireActorMember(actor)
    const [row] = await db<IRelativeCountRow[]>`
        select
            (select count(*)::int from book_shares s where s.proposed_by_member_id = ${memberId}) as proposed_by_me,
            (select count(*)::int from book_shares s where s.proposed_by_member_id = ${memberId} and s.status = 'pending') as proposals_waiting,
            (select count(*)::int from book_shares s where s.target_family_id = ${actor.familyId} and s.recorder_member_id = ${memberId} and s.mode = 'record' and s.status in ('pending', 'accepted'))
                + (select count(distinct l.book_id)::int from lines l join books b on b.id = l.book_id and b.deleted_at is null and b.status in ('to_record', 'in_review', 'ready')
                    where l.family_id = ${actor.familyId} and l.member_id = ${memberId}
                        and not exists (select 1 from recordings r where r.line_id = l.id and r.language = b.language and r.status in ('draft', 'submitted', 'approved'))) as requests,
            (select count(distinct l.book_id)::int from recordings r join lines l on l.id = r.line_id join books b on b.id = l.book_id and b.deleted_at is null
                where l.family_id = ${actor.familyId} and r.member_id = ${memberId} and r.status = 'changes_requested') as to_fix
    `
    return {
        ...EMPTY,
        proposedByMe: row?.proposed_by_me ?? 0,
        proposalsWaiting: row?.proposals_waiting ?? 0,
        requests: row?.requests ?? 0,
        toFix: row?.to_fix ?? 0,
    }
})
