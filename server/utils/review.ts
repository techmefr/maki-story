import type { Sql, TransactionSql } from 'postgres'
import { deliverOutOfApp } from '~~/technical/Mail/server/utils/delivery'
import { badRequest, notFound } from './validate'

type Db = Sql | TransactionSql

export interface IReviewBook {
    id: string
    title: string
    language: string
    status: BookStatus
}

export const MAX_COMMENT_LENGTH = 500

export const findReviewBook = async (db: Db, bookId: string, familyId: string): Promise<IReviewBook> => {
    const [book] = await db<IReviewBook[]>`
        select id, title, language, status from books where id = ${bookId} and family_id = ${familyId} and deleted_at is null
    `
    return book ?? notFound('Book not found')
}

export const checkComment = (value: unknown): string => {
    if (typeof value !== 'string' || value.trim() === '') {
        return badRequest('Explain what to change')
    }
    return value.trim().length > MAX_COMMENT_LENGTH ? badRequest('The comment is too long') : value.trim()
}

export interface IActivityInput {
    familyId: string
    bookId: string
    kind: ActivityKind
    lineId?: string | null
    actorMemberId?: string | null
    subjectMemberId?: string | null
    body?: string
    count?: number
}

export const logActivity = async (db: Db, input: IActivityInput): Promise<void> => {
    await db`
        insert into book_activity (family_id, book_id, line_id, actor_member_id, subject_member_id, kind, body, count)
        values (${input.familyId}, ${input.bookId}, ${input.lineId ?? null}, ${input.actorMemberId ?? null}, ${input.subjectMemberId ?? null},
            ${input.kind}, ${input.body ?? ''}, ${input.count ?? 1})
    `
}

export interface IReviewNoticeInput {
    familyId: string
    recipientMemberId: string | null
    kind: NotificationKind
    groupKey: string
    book: IReviewBook
    memberName: string
    count: number
    approved?: number
    returned?: number
}

export const notifyReview = async (db: Db, input: IReviewNoticeInput): Promise<void> => {
    const approved = input.approved ?? 0
    const returned = input.returned ?? 0
    const base = { bookId: input.book.id, bookTitle: input.book.title, memberName: input.memberName }
    const merged = await db`
        update notifications
        set count = count + ${input.count}::int,
            payload = payload || jsonb_build_object(
                'bookTitle', ${input.book.title}::text,
                'approved', coalesce((payload->>'approved')::int, 0) + ${approved}::int,
                'returned', coalesce((payload->>'returned')::int, 0) + ${returned}::int
            ),
            updated_at = now()
        where family_id = ${input.familyId} and group_key = ${input.groupKey} and read_at is null
            and recipient_member_id is not distinct from ${input.recipientMemberId}
        returning id
    `
    if (merged.length > 0) {
        return
    }
    await db`
        insert into notifications (family_id, recipient_member_id, kind, payload, group_key, count)
        values (${input.familyId}, ${input.recipientMemberId}, ${input.kind}, ${db.json({ ...base, approved, returned })}, ${input.groupKey}, ${input.count})
    `
    await deliverOutOfApp(db, { familyId: input.familyId, recipientMemberId: input.recipientMemberId, kind: input.kind, payload: { ...base, approved, returned }, count: input.count })
}

export interface ISubmission {
    familyId: string
    book: IReviewBook
    memberId: string
    count: number
    lineId?: string | null
    kind: 'submitted' | 'resubmitted'
}

export const recordSubmission = async (db: Db, input: ISubmission): Promise<void> => {
    await db`
        update books set status = 'in_review' where id = ${input.book.id} and family_id = ${input.familyId} and status in ('draft', 'to_record')
    `
    await logActivity(db, {
        familyId: input.familyId,
        bookId: input.book.id,
        kind: input.kind,
        lineId: input.lineId,
        actorMemberId: input.memberId,
        subjectMemberId: input.memberId,
        count: input.count,
    })
    const [member] = await db<{ name: string }[]>`select name from members where id = ${input.memberId}`
    await notifyReview(db, {
        familyId: input.familyId,
        recipientMemberId: null,
        kind: 'recording_batch',
        groupKey: `recording:${input.book.id}:${input.memberId}`,
        book: input.book,
        memberName: member?.name ?? '',
        count: input.count,
    })
}

export const notifyVoiceResult = async (
    db: Db,
    familyId: string,
    book: IReviewBook,
    reviewerId: string,
    voiceId: string,
    result: { approved: number; returned: number },
): Promise<void> => {
    if (voiceId === reviewerId) {
        return
    }
    const [reviewer] = await db<{ name: string }[]>`select name from members where id = ${reviewerId}`
    await notifyReview(db, {
        familyId,
        recipientMemberId: voiceId,
        kind: 'review_result',
        groupKey: `review-result:${book.id}:${voiceId}`,
        book,
        memberName: reviewer?.name ?? '',
        count: result.approved + result.returned,
        approved: result.approved,
        returned: result.returned,
    })
}

export const completeIfAllApproved = async (db: Db, familyId: string, book: IReviewBook, actorMemberId: string | null): Promise<boolean> => {
    const [state] = await db<{ lines: number; approved: number }[]>`
        select count(*)::int as lines,
            count(*) filter (where exists (
                select 1 from recordings r where r.line_id = l.id and r.language = ${book.language} and r.status = 'approved'
            ))::int as approved
        from lines l where l.book_id = ${book.id} and l.family_id = ${familyId}
    `
    if (!state || state.lines === 0 || state.approved < state.lines || book.status === 'ready') {
        return false
    }
    await db`update books set status = 'ready' where id = ${book.id} and family_id = ${familyId}`
    await logActivity(db, { familyId, bookId: book.id, kind: 'validated', actorMemberId, count: state.lines })
    return true
}

export const logNewVoices = async (db: Db, familyId: string, book: IReviewBook, actorMemberId: string | null, memberIds: string[]): Promise<void> => {
    for (const memberId of memberIds) {
        const [known] = await db<{ id: string }[]>`
            select r.id from recordings r join lines l on l.id = r.line_id
            where l.book_id = ${book.id} and r.member_id = ${memberId} and r.status = 'approved' limit 1
        `
        if (!known) {
            await logActivity(db, { familyId, bookId: book.id, kind: 'voice_added', actorMemberId, subjectMemberId: memberId })
        }
    }
}

export const approveBook = async (db: Db, familyId: string, book: IReviewBook, actorMemberId: string | null): Promise<number> => {
    const wasReady = book.status === 'ready'
    const voices = await db<{ memberId: string }[]>`
        select distinct r.member_id from recordings r join lines l on l.id = r.line_id
        where l.book_id = ${book.id} and r.family_id = ${familyId} and r.status in ('draft', 'submitted')
    `
    if (wasReady) {
        await logNewVoices(db, familyId, book, actorMemberId, voices.map(voice => voice.memberId))
    }
    const approved = await db<{ memberId: string }[]>`
        update recordings r set status = 'approved'
        from lines l
        where l.id = r.line_id and l.book_id = ${book.id} and r.family_id = ${familyId} and r.status in ('draft', 'submitted')
        returning r.member_id
    `
    await db`
        delete from approved_takes t using recordings r, lines l
        where r.line_id = t.line_id and r.language = t.language and r.status = 'approved'
            and l.id = t.line_id and l.book_id = ${book.id} and t.family_id = ${familyId}
    `
    await db`update books set status = 'ready' where id = ${book.id} and family_id = ${familyId}`
    await db`
        update review_comments set resolved_at = now() where book_id = ${book.id} and family_id = ${familyId} and resolved_at is null
    `
    await logActivity(db, { familyId, bookId: book.id, kind: 'validated', actorMemberId, count: approved.length })
    for (const voice of voices) {
        const count = approved.filter(row => row.memberId === voice.memberId).length
        await notifyVoiceResult(db, familyId, book, actorMemberId ?? '', voice.memberId, { approved: count, returned: 0 })
    }
    return approved.length
}
