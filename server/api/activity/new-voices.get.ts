import { getDb } from '../../utils/db'
import { requireActorMember, requireRole } from '~~/technical/Auth/server/utils/permissions'

export default defineEventHandler(async (event): Promise<INewVoices[]> => {
    const actor = await requireRole(event, 'child')
    const memberId = requireActorMember(actor)
    return getDb()<INewVoices[]>`
        select a.book_id, array_agg(distinct a.subject_member_id) as member_ids
        from book_activity a
        join books b on b.id = a.book_id and b.deleted_at is null and b.status = 'ready'
        left join book_visits v on v.book_id = a.book_id and v.member_id = ${memberId}
        where a.family_id = ${actor.familyId} and a.kind = 'voice_added' and a.subject_member_id is not null
            and (v.last_seen_at is null or a.created_at > v.last_seen_at)
        group by a.book_id
    `
})
