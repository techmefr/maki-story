import { checkLanguage } from '../../../../../utils/bookModel'
import { getDb } from '../../../../../utils/db'
import { actorEntry, record } from '../../../../../utils/journal'
import { logEvent } from '../../../../../utils/log'
import { requireActorMember, requirePermission } from '../../../../../utils/permissions'
import { preserveApprovedTake } from '../../../../../utils/recordings'
import { checkComment, completeIfAllApproved, findReviewBook, logActivity, logNewVoices, notifyVoiceResult } from '../../../../../utils/review'
import { badRequest, notFound, requireParam } from '../../../../../utils/validate'

const conflict = (message: string): never => {
    throw createError({ statusCode: 409, statusMessage: message })
}

interface IReviewOutcome {
    status: RecordingStatus
    isBookReady: boolean
}

export default defineEventHandler(async (event): Promise<IReviewOutcome> => {
    const actor = await requirePermission(event, 'books.review')
    const reviewerId = requireActorMember(actor)
    const { familyId } = actor
    const bookId = requireParam(event, 'id')
    const lineId = requireParam(event, 'lineId')
    const body = await readBody<IReviewActionBody>(event)
    if (body.action !== 'approve' && body.action !== 'request_changes') {
        return badRequest('Invalid action')
    }
    const outcome = await getDb().begin(async (tx): Promise<IReviewOutcome> => {
        const book = await findReviewBook(tx, bookId, familyId)
        const language = body.language === undefined ? book.language : checkLanguage(body.language)
        const [line] = await tx<{ id: string }[]>`select id from lines where id = ${lineId} and book_id = ${bookId} and family_id = ${familyId}`
        if (!line) {
            return notFound('Line not found')
        }
        const [recording] = await tx<{ id: string; memberId: string; status: RecordingStatus }[]>`
            select id, member_id, status from recordings where line_id = ${lineId} and family_id = ${familyId} and language = ${language} for update
        `
        if (!recording) {
            return notFound('No take to review')
        }
        if (recording.status === 'stale') {
            return conflict('This take is outdated, the voice has to record it again')
        }
        if (body.action === 'approve') {
            if (book.status === 'ready' && recording.status !== 'approved') {
                await logNewVoices(tx, familyId, book, reviewerId, [recording.memberId])
            }
            await tx`update recordings set status = 'approved' where id = ${recording.id}`
            await tx`delete from approved_takes where line_id = ${lineId} and family_id = ${familyId} and language = ${language}`
            await tx`update review_comments set resolved_at = now() where line_id = ${lineId} and resolved_at is null`
            if (recording.status !== 'approved') {
                await logActivity(tx, { familyId, bookId, kind: 'approved', lineId, actorMemberId: reviewerId, subjectMemberId: recording.memberId })
                await notifyVoiceResult(tx, familyId, book, reviewerId, recording.memberId, { approved: 1, returned: 0 })
            }
            const isCompleted = await completeIfAllApproved(tx, familyId, book, reviewerId)
            return { status: 'approved', isBookReady: isCompleted || book.status === 'ready' }
        }
        const comment = checkComment(body.comment)
        if (recording.status === 'approved') {
            await preserveApprovedTake(tx, lineId, familyId, language)
        }
        await tx`update recordings set status = 'changes_requested' where id = ${recording.id}`
        await tx`update review_comments set resolved_at = now() where line_id = ${lineId} and resolved_at is null`
        await tx`
            insert into review_comments (family_id, book_id, line_id, recording_id, author_member_id, body)
            values (${familyId}, ${bookId}, ${lineId}, ${recording.id}, ${reviewerId}, ${comment})
        `
        await tx`update books set status = 'in_review' where id = ${bookId} and family_id = ${familyId} and status in ('draft', 'to_record')`
        await logActivity(tx, { familyId, bookId, kind: 'changes_requested', lineId, actorMemberId: reviewerId, subjectMemberId: recording.memberId, body: comment })
        await notifyVoiceResult(tx, familyId, book, reviewerId, recording.memberId, { approved: 0, returned: 1 })
        return { status: 'changes_requested', isBookReady: false }
    })
    await record(event, { ...actorEntry(actor), action: `review.line.${body.action}`, entityType: 'line', entityId: lineId })
    logEvent(`Relecture : ${body.action}`)
    return outcome
})
