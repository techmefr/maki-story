import type { Sql, TransactionSql } from 'postgres'
import { loadBook } from './books'
import { getDb } from './db'
import type { IZipEntry } from './zip'

type Db = Sql | TransactionSql

const MIME_EXTENSIONS: Record<string, string> = {
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/mp4': 'm4a',
    'audio/mpeg': 'mp3',
    'audio/wav': 'wav',
    'audio/x-wav': 'wav',
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
}

export const TOMBSTONE_RESTORE_DAYS = 30

export const extensionOf = (mime: string): string => MIME_EXTENSIONS[mime.split(';')[0]?.trim() ?? ''] ?? 'bin'

export const mediaPath = (fileId: string, mime: string): string => `media/${fileId}.${extensionOf(mime)}`

const memberRows = (db: Db, familyId: string) => db`
    select id, name, role, color, status, voice_policy, spoken_languages, birth_date::text as birth_date, photo_file_id, source_member_id is not null as is_guest, created_at, deleted_at
    from members where family_id = ${familyId} order by created_at
`

export interface IFamilyExport {
    json: Record<string, unknown>
    fileIds: Set<string>
}

export const collectFamilyExport = async (db: Db, familyId: string): Promise<IFamilyExport> => {
    const [family] = await db<{ id: string; name: string; createdAt: string }[]>`select id, name, created_at from families where id = ${familyId}`
    const members = await memberRows(db, familyId)
    const bookIds = await db<{ id: string }[]>`select id from books where family_id = ${familyId} and deleted_at is null order by created_at`
    const books = []
    for (const row of bookIds) {
        books.push(await loadBook(row.id, familyId))
    }
    const comments = await db`
        select id, book_id, line_id, author_member_id, body, created_at, resolved_at from review_comments where family_id = ${familyId} order by created_at
    `
    const activity = await db`
        select id, book_id, line_id, actor_member_id, subject_member_id, kind, body, count, created_at from book_activity where family_id = ${familyId} order by created_at
    `
    const messages = await db`
        select id, from_member_id, to_member_id, file_id, mime, duration_ms, kind, status, first_listened_at, expires_at, created_at
        from messages where family_id = ${familyId} and deleted_at is null and status = 'ACTIVE' order by created_at
    `
    const treasures = await db`
        select id, child_id, source_message_id, from_member_id, file_id, mime, duration_ms, created_at
        from treasures where family_id = ${familyId} and deleted_at is null order by created_at
    `
    const shares = await db`
        select s.id, s.book_id, s.mode, s.status, s.created_at, oy.name as owner_family_name, ty.name as target_family_name
        from book_shares s
        join families oy on oy.id = s.owner_family_id
        join families ty on ty.id = s.target_family_id
        where s.owner_family_id = ${familyId} or s.target_family_id = ${familyId}
        order by s.created_at
    `
    const fileIds = new Set<string>()
    members.forEach(member => member.photoFileId && fileIds.add(String(member.photoFileId)))
    books.forEach(book => {
        book.pages.forEach(page => page.fileId && fileIds.add(page.fileId))
        book.recordings.forEach(recording => fileIds.add(recording.fileId))
    })
    messages.forEach(message => fileIds.add(String(message.fileId)))
    treasures.forEach(treasure => fileIds.add(String(treasure.fileId)))
    const json = { exportedAt: new Date().toISOString(), family, members, books, reviewComments: comments, bookActivity: activity, messages, treasures, shares }
    return { json, fileIds }
}

export async function* familyExportEntries(familyId: string): AsyncGenerator<IZipEntry> {
    const db = getDb()
    const { json, fileIds } = await collectFamilyExport(db, familyId)
    const manifest: Record<string, { path: string; mime: string }> = {}
    const ids = [...fileIds]
    const mimes = ids.length === 0 ? [] : await db<{ id: string; mime: string }[]>`select id, mime from files where family_id = ${familyId} and id in ${db(ids)}`
    mimes.forEach(file => {
        manifest[file.id] = { path: mediaPath(file.id, file.mime), mime: file.mime }
    })
    yield { name: 'family.json', data: Buffer.from(JSON.stringify({ ...json, media: manifest }, null, 2), 'utf8') }
    for (const file of mimes) {
        const [row] = await db<{ data: Buffer }[]>`select data from files where id = ${file.id} and family_id = ${familyId}`
        if (row) {
            yield { name: manifest[file.id]!.path, data: row.data }
        }
    }
}

export interface IFamilyDeletionResult {
    tables: number
    guestVoicesRemoved: number
}

const FK_VIOLATION = '23503'
const MAX_PASSES = 12

const familyScopedTables = async (tx: Db): Promise<string[]> => {
    const rows = await tx<{ tableName: string }[]>`
        select c.table_name from information_schema.columns c
        join information_schema.tables t on t.table_schema = c.table_schema and t.table_name = c.table_name
        where c.table_schema = 'public' and c.column_name = 'family_id' and t.table_type = 'BASE TABLE'
            and c.table_name not in ('families', 'error_log', 'family_tombstones')
        order by c.table_name
    `
    return rows.map(row => row.tableName)
}

export const deleteFamilyData = async (db: Sql, familyId: string): Promise<IFamilyDeletionResult> => {
    return db.begin(async tx => {
        const guests = await tx<{ id: string }[]>`select id from members where source_family_id = ${familyId}`
        const guestIds = guests.map(guest => guest.id)
        if (guestIds.length > 0) {
            const guestFiles = await tx<{ fileId: string }[]>`select file_id from recordings where member_id in ${tx(guestIds)}`
            await tx`delete from approved_takes where member_id in ${tx(guestIds)}`
            await tx`delete from recordings where member_id in ${tx(guestIds)}`
            const orphanIds = guestFiles.map(file => file.fileId)
            if (orphanIds.length > 0) {
                await tx`delete from files f where f.id in ${tx(orphanIds)} and not exists (select 1 from recordings r where r.file_id = f.id)`
            }
            await tx`update members set name = '', deleted_at = now(), source_family_id = null where id in ${tx(guestIds)}`
        }
        await tx`delete from book_shares where owner_family_id = ${familyId} or target_family_id = ${familyId} or approver_family_id = ${familyId}`
        await tx`update books set origin_family_id = null, origin_book_id = null where origin_family_id = ${familyId} and family_id <> ${familyId}`
        const accountIds = (await tx<{ accountId: string }[]>`select account_id from account_families where family_id = ${familyId}`).map(row => row.accountId)
        const tables = await familyScopedTables(tx)
        let remaining = [...tables]
        for (let pass = 0; pass < MAX_PASSES && remaining.length > 0; pass++) {
            const blocked: string[] = []
            for (const table of remaining) {
                try {
                    await tx.savepoint(async sp => {
                        await sp.unsafe(`delete from "${table}" where family_id = $1`, [familyId])
                    })
                } catch (error) {
                    if ((error as { code?: string }).code !== FK_VIOLATION) {
                        throw error
                    }
                    blocked.push(table)
                }
            }
            if (blocked.length === remaining.length) {
                throw new Error(`Cannot delete family data: ${blocked.join(', ')}`)
            }
            remaining = blocked
        }
        await tx`update error_log set family_id = null where family_id = ${familyId}`
        await tx`delete from families where id = ${familyId}`
        if (accountIds.length > 0) {
            await tx`
                delete from accounts a where a.id in ${tx(accountIds)}
                    and not exists (select 1 from account_families af where af.account_id = a.id)
            `
        }
        await tx`
            insert into family_tombstones (family_id, restore_until)
            values (${familyId}, now() + make_interval(days => ${TOMBSTONE_RESTORE_DAYS}))
            on conflict (family_id) do nothing
        `
        return { tables: tables.length, guestVoicesRemoved: guestIds.length }
    })
}
