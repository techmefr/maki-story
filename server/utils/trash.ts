import type { Sql, TransactionSql } from 'postgres'
import { ERROR_LOG_RETENTION_DAYS, JOURNAL_RETENTION_MONTHS, RESTORE_WINDOW_DAYS, TRASH_PAGE_LIMIT } from '../../shared/utils/retention'
import { record } from './journal'

type Db = Sql | TransactionSql

const MEMBER_MESSAGE_WINDOW_SECONDS = 10
const TREASURE_LIMIT = 10
const UNIQUE_VIOLATION = '23505'
const CHECK_VIOLATION = '23514'
const FK_VIOLATION = '23503'

const conflict = (message: string): never => {
    throw createError({ statusCode: 409, statusMessage: message })
}

export const listTrash = async (db: Db, familyId: string): Promise<ITrashItem[]> => {
    const window = `${RESTORE_WINDOW_DAYS} days`
    const books = await db<ITrashItem[]>`
        select 'book' as type, id, title as label, status as detail, 1 as count, deleted_at, deleted_at + ${window}::interval as restore_until
        from books where family_id = ${familyId} and deleted_at > now() - ${window}::interval
    `
    const members = await db<ITrashItem[]>`
        select 'member' as type, id, name as label, role as detail, 1 as count, deleted_at, deleted_at + ${window}::interval as restore_until
        from members where family_id = ${familyId} and source_member_id is null and name <> '' and deleted_at > now() - ${window}::interval
    `
    const messages = await db<ITrashItem[]>`
        select 'message' as type, m.id, coalesce(f.name, '') as label, coalesce(t.name, '') as detail, 1 as count, m.deleted_at, m.deleted_at + ${window}::interval as restore_until
        from messages m
        left join members f on f.id = m.from_member_id
        left join members t on t.id = m.to_member_id
        where m.family_id = ${familyId} and m.deleted_at > now() - ${window}::interval and (m.expires_at is null or m.expires_at > now())
            and f.deleted_at is null and t.deleted_at is null
    `
    const treasures = await db<ITrashItem[]>`
        select 'treasure' as type, tr.id, coalesce(c.name, '') as label, coalesce(f.name, '') as detail, 1 as count, tr.deleted_at, tr.deleted_at + ${window}::interval as restore_until
        from treasures tr
        left join members c on c.id = tr.child_id
        left join members f on f.id = tr.from_member_id
        where tr.family_id = ${familyId} and tr.deleted_at > now() - ${window}::interval
    `
    const recordings = await db<ITrashItem[]>`
        select 'recordings' as type, r.member_id as id, coalesce(m.name, '') as label, '' as detail, count(*)::int as count, max(r.deleted_at) as deleted_at,
            max(r.deleted_at) + ${window}::interval as restore_until
        from recordings r left join members m on m.id = r.member_id
        where r.family_id = ${familyId} and r.deleted_at > now() - ${window}::interval
        group by r.member_id, m.name
    `
    return [...books, ...members, ...messages, ...treasures, ...recordings]
        .sort((left, right) => new Date(right.deletedAt).getTime() - new Date(left.deletedAt).getTime())
        .slice(0, TRASH_PAGE_LIMIT)
}

const restoreBook = async (tx: TransactionSql, familyId: string, id: string): Promise<number> => {
    const rows = await tx`update books set deleted_at = null where id = ${id} and family_id = ${familyId} and deleted_at is not null returning id`
    return rows.length
}

const restoreMember = async (tx: TransactionSql, familyId: string, id: string): Promise<number> => {
    const [member] = await tx<{ deletedAt: Date }[]>`
        select deleted_at from members where id = ${id} and family_id = ${familyId} and deleted_at is not null and source_member_id is null and name <> ''
    `
    if (!member) {
        return 0
    }
    await tx`update members set deleted_at = null where id = ${id} and family_id = ${familyId}`
    await tx`
        update messages set deleted_at = null, status = case when status = 'DELETED' then 'ACTIVE' else status end
        where family_id = ${familyId} and (from_member_id = ${id} or to_member_id = ${id}) and deleted_at is not null
            and deleted_at between ${member.deletedAt}::timestamptz - make_interval(secs => ${MEMBER_MESSAGE_WINDOW_SECONDS})
                and ${member.deletedAt}::timestamptz + make_interval(secs => ${MEMBER_MESSAGE_WINDOW_SECONDS})
            and (expires_at is null or expires_at > now())
    `
    return 1
}

const restoreMessage = async (tx: TransactionSql, familyId: string, id: string): Promise<number> => {
    const rows = await tx`
        update messages set deleted_at = null, status = 'ACTIVE'
        where id = ${id} and family_id = ${familyId} and deleted_at is not null and (expires_at is null or expires_at > now())
        returning id
    `
    return rows.length
}

const restoreTreasure = async (tx: TransactionSql, familyId: string, id: string): Promise<number> => {
    const [target] = await tx<{ childId: string }[]>`select child_id from treasures where id = ${id} and family_id = ${familyId} and deleted_at is not null`
    if (!target) {
        return 0
    }
    await tx`select pg_advisory_xact_lock(hashtext(${target.childId}))`
    const [count] = await tx<{ count: number }[]>`select count(*)::int as count from treasures where child_id = ${target.childId} and deleted_at is null`
    if ((count?.count ?? 0) >= TREASURE_LIMIT) {
        return conflict('The treasure box is full')
    }
    const rows = await tx`update treasures set deleted_at = null where id = ${id} and family_id = ${familyId} returning id`
    return rows.length
}

const restoreRecordings = async (tx: TransactionSql, familyId: string, memberId: string): Promise<number> => {
    const rows = await tx`
        update recordings set deleted_at = null, status = coalesce(deleted_status, 'draft'), deleted_status = null
        where member_id = ${memberId} and family_id = ${familyId} and deleted_at is not null
        returning id
    `
    return rows.length
}

export const restoreTrashItem = async (db: Sql, familyId: string, type: TrashItemType, id: string): Promise<void> => {
    const restored = await db
        .begin(async tx => {
            switch (type) {
                case 'book':
                    return restoreBook(tx, familyId, id)
                case 'member':
                    return restoreMember(tx, familyId, id)
                case 'message':
                    return restoreMessage(tx, familyId, id)
                case 'treasure':
                    return restoreTreasure(tx, familyId, id)
                default:
                    return restoreRecordings(tx, familyId, id)
            }
        })
        .catch((error: { code?: string }) => {
            if (error.code === UNIQUE_VIOLATION || error.code === CHECK_VIOLATION) {
                return conflict('This item can no longer be restored')
            }
            throw error
        })
    if (restored === 0) {
        throw createError({ statusCode: 404, statusMessage: 'Nothing to restore' })
    }
}

export const deleteUnreferencedFiles = async (db: Db, fileIds: string[]): Promise<number> => {
    const unique = [...new Set(fileIds)]
    if (unique.length === 0) {
        return 0
    }
    const rows = await db`
        delete from files f
        where f.id in ${db(unique)}
            and not exists (select 1 from recordings r where r.file_id = f.id)
            and not exists (select 1 from approved_takes a where a.file_id = f.id)
            and not exists (select 1 from book_pages p where p.file_id = f.id)
            and not exists (select 1 from messages m where m.file_id = f.id)
            and not exists (select 1 from treasures t where t.file_id = f.id)
            and not exists (select 1 from members mb where mb.photo_file_id = f.id)
        returning f.id
    `
    return rows.length
}

export interface IPurgeReport {
    books: number
    members: number
    messages: number
    treasures: number
    recordings: number
    files: number
    journal: number
    errors: number
    tombstones: number
}

export const purgeTrash = async (db: Sql, familyId: string | null = null): Promise<IPurgeReport> => {
    const cutoff = `${RESTORE_WINDOW_DAYS} days`
    const scope = familyId
    const report: IPurgeReport = { books: 0, members: 0, messages: 0, treasures: 0, recordings: 0, files: 0, journal: 0, errors: 0, tombstones: 0 }
    const fileIds: string[] = []

    const books = await db<{ id: string; familyId: string }[]>`
        select id, family_id from books where deleted_at < now() - ${cutoff}::interval and (${scope}::text is null or family_id = ${scope})
    `
    for (const book of books) {
        const pageFiles = await db<{ fileId: string }[]>`select file_id from book_pages where book_id = ${book.id} and file_id is not null`
        const recordingFiles = await db<{ fileId: string }[]>`
            select r.file_id from recordings r join lines l on l.id = r.line_id where l.book_id = ${book.id}
            union select a.file_id from approved_takes a join lines l on l.id = a.line_id where l.book_id = ${book.id}
        `
        fileIds.push(...pageFiles.map(row => row.fileId), ...recordingFiles.map(row => row.fileId))
        await db`delete from approved_takes where line_id in (select id from lines where book_id = ${book.id})`
        await db`delete from books where id = ${book.id}`
        await record(null, { familyId: book.familyId, action: 'book.purged', entityType: 'book', entityId: book.id }, db)
        report.books++
    }

    const recordings = await db<{ id: string; fileId: string; familyId: string }[]>`
        delete from recordings where deleted_at < now() - ${cutoff}::interval and (${scope}::text is null or family_id = ${scope})
        returning id, file_id, family_id
    `
    fileIds.push(...recordings.map(row => row.fileId))
    report.recordings = recordings.length

    const messages = await db<{ id: string; fileId: string }[]>`
        delete from messages where deleted_at < now() - ${cutoff}::interval and (${scope}::text is null or family_id = ${scope}) returning id, file_id
    `
    fileIds.push(...messages.map(row => row.fileId))
    report.messages = messages.length

    const treasures = await db<{ id: string; fileId: string }[]>`
        delete from treasures where deleted_at < now() - ${cutoff}::interval and (${scope}::text is null or family_id = ${scope}) returning id, file_id
    `
    fileIds.push(...treasures.map(row => row.fileId))
    report.treasures = treasures.length

    const members = await db<{ id: string; familyId: string; photoFileId: string | null }[]>`
        select id, family_id, photo_file_id from members
        where deleted_at < now() - ${cutoff}::interval and source_member_id is null and name <> '' and (${scope}::text is null or family_id = ${scope})
    `
    for (const member of members) {
        try {
            await db.begin(async tx => {
                const [used] = await tx<{ count: number }[]>`
                    select (select count(*) from recordings where member_id = ${member.id}) + (select count(*) from approved_takes where member_id = ${member.id}) as count
                `
                if (Number(used?.count ?? 0) > 0) {
                    await tx`
                        update members set name = '', photo_file_id = null, pin_hash = null, code_kind = null, birth_date = null, spoken_languages = array[]::text[]
                        where id = ${member.id}
                    `
                } else {
                    await tx`delete from members where id = ${member.id}`
                }
            })
        } catch (error) {
            if ((error as { code?: string }).code !== FK_VIOLATION) {
                throw error
            }
            await db`update members set name = '', photo_file_id = null, pin_hash = null, code_kind = null, birth_date = null where id = ${member.id}`
        }
        if (member.photoFileId) {
            fileIds.push(member.photoFileId)
        }
        await record(null, { familyId: member.familyId, action: 'member.purged', entityType: 'member', entityId: member.id }, db)
        report.members++
    }

    report.files = await deleteUnreferencedFiles(db, fileIds)

    const tombstones = await db`delete from family_tombstones where restore_until < now() returning family_id`
    report.tombstones = tombstones.length
    if (scope === null) {
        report.journal = (await db`delete from audit_log where created_at < now() - make_interval(months => ${JOURNAL_RETENTION_MONTHS}) returning id`).length
        report.errors = (await db`delete from error_log where created_at < now() - make_interval(days => ${ERROR_LOG_RETENTION_DAYS}) returning id`).length
    }
    return report
}
