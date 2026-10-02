import { getDb } from '../../utils/db'
import { requireSession } from '../../utils/family'

interface ISeat {
    familyId: string
    familyName: string
    memberId: string
    childIds: string[]
}

export default defineEventHandler(async (event): Promise<IRelativeFlow> => {
    const { accountId, familyId: currentFamilyId } = requireSession(event)
    const db = getDb()
    const seats = await db<ISeat[]>`
        select ms.family_id, f.name as family_name, ms.member_id, ms.child_ids
        from memberships ms
        join families f on f.id = ms.family_id and f.deleted_at is null
        join members m on m.id = ms.member_id and m.deleted_at is null and m.status = 'active'
        where ms.account_id = ${accountId} and ms.role = 'relative' and ms.status = 'ACTIVE'
        order by ms.created_at
    `
    const families: IRelativeFamily[] = []
    for (const seat of seats) {
        const children = await db<IRelativeChild[]>`
            select id, name, color, photo_file_id from members
            where family_id = ${seat.familyId} and role = 'child' and deleted_at is null and status = 'active' and source_member_id is null
                and (${seat.childIds.length === 0} or id in ${db(seat.childIds.length === 0 ? [''] : seat.childIds)})
            order by created_at
        `
        const shareRequests = await db<IRelativeRequest[]>`
            select 'share' as kind, b.id as book_id, b.title as book_title,
                (select count(*)::int from share_lines sl where sl.share_id = s.id) as line_count, s.id as share_id
            from book_shares s join books b on b.id = s.book_id
            where s.target_family_id = ${seat.familyId} and s.recorder_member_id = ${seat.memberId} and s.mode = 'record' and s.status in ('pending', 'accepted')
            order by s.created_at desc limit 50
        `
        const lineRequests = await db<IRelativeRequest[]>`
            select 'line' as kind, b.id as book_id, b.title as book_title, count(*)::int as line_count, null::text as share_id
            from lines l join books b on b.id = l.book_id and b.deleted_at is null and b.status in ('to_record', 'in_review', 'ready')
            where l.family_id = ${seat.familyId} and l.member_id = ${seat.memberId}
                and not exists (
                    select 1 from recordings r where r.line_id = l.id and r.language = b.language and r.status in ('draft', 'submitted', 'approved')
                )
            group by b.id, b.title order by b.title limit 50
        `
        const proposals = await db<IRelativeProposal[]>`
            select s.id as share_id, b.title as book_title, s.status
            from book_shares s join books b on b.id = s.book_id
            where s.proposed_by_member_id = ${seat.memberId}
            order by s.created_at desc limit 50
        `
        families.push({
            familyId: seat.familyId,
            familyName: seat.familyName,
            memberId: seat.memberId,
            children,
            requests: [...shareRequests, ...lineRequests],
            proposals,
        })
    }
    return { families, currentFamilyId }
})
