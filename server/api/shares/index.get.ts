import { getDb } from '../../utils/db'
import { requirePermission } from '../../utils/permissions'

const MAX_SHARES = 100
const AWAITING_STATUSES: ShareStatus[] = ['proposed', 'awaiting_owner']

interface IShareRecord extends IShare {
    ownerFamilyId: string
    targetFamilyId: string
    approverFamilyId: string | null
    proposedByMemberId: string | null
}

export default defineEventHandler(async (event): Promise<IShareLists> => {
    const actor = await requirePermission(event, 'shares.list')
    const { familyId, memberId } = actor
    const isParent = actor.role === 'parent'
    const rows = await getDb()<IShareRecord[]>`
        select s.id, s.book_id, b.title as book_title, s.mode, s.status,
            ofm.name as owner_family_name, tfm.name as target_family_name, pm.name as proposed_by_name,
            s.recorder_member_id, s.message, s.created_at,
            s.owner_family_id, s.target_family_id, s.approver_family_id, s.proposed_by_member_id,
            case when s.mode = 'record' then (select count(*)::int from share_lines sl where sl.share_id = s.id)
                else (select count(*)::int from lines l where l.book_id = s.book_id) end as line_count,
            (select count(*)::int from share_lines sl join recordings r on r.line_id = sl.line_id and r.status <> 'stale'
                where sl.share_id = s.id) as recorded_count
        from book_shares s
        join books b on b.id = s.book_id
        join families ofm on ofm.id = s.owner_family_id
        join families tfm on tfm.id = s.target_family_id
        left join members pm on pm.id = s.proposed_by_member_id
        where ${
            isParent
                ? getDb()`(s.owner_family_id = ${familyId} or s.target_family_id = ${familyId} or s.approver_family_id = ${familyId})`
                : getDb()`(s.proposed_by_member_id = ${memberId} or (s.target_family_id = ${familyId} and s.recorder_member_id = ${memberId}))`
        }
        order by s.created_at desc limit ${MAX_SHARES}
    `
    const toShare = (row: IShareRecord): IShare => {
        const { ownerFamilyId, targetFamilyId, approverFamilyId, proposedByMemberId, ...share } = row
        return share
    }
    const isAwaitingApproval = (row: IShareRecord): boolean => row.approverFamilyId === familyId && ['proposed', 'awaiting_owner'].includes(row.status)
    return {
        approvals: isParent ? rows.filter(isAwaitingApproval).map(toShare) : [],
        outgoing: rows.filter(row => !(isParent && isAwaitingApproval(row)) && (row.ownerFamilyId === familyId || row.proposedByMemberId === memberId)).map(toShare),
        incoming: rows.filter(row => row.targetFamilyId === familyId && !AWAITING_STATUSES.includes(row.status)).map(toShare),
    }
})
