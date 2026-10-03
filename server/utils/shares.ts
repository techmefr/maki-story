import type { Sql, TransactionSql } from 'postgres'
import { ACTIVE_SHARE_STATUSES, MAX_FAMILIES_PER_BOOK } from '../../shared/utils/sharing'
import { one } from './db'
import { notify } from './notifications'
import type { IActor } from '~~/technical/Auth/server/utils/permissions'
import { notFound } from './validate'

type Db = Sql | TransactionSql

export interface IShareRow {
    id: string
    bookId: string
    rootBookId: string
    ownerFamilyId: string
    targetFamilyId: string
    approverFamilyId: string | null
    mode: ShareMode
    status: ShareStatus
    proposedByMemberId: string | null
    recorderMemberId: string | null
}

const SHARE_COLUMNS = `id, book_id, root_book_id, owner_family_id, target_family_id, approver_family_id, mode, status, proposed_by_member_id, recorder_member_id`

export const loadShareRow = async (db: Db, id: string): Promise<IShareRow> => {
    const [row] = await db.unsafe<IShareRow[]>(`select ${SHARE_COLUMNS} from book_shares where id = $1`, [id])
    return row ?? notFound('Share not found')
}

export const countSharedFamilies = async (db: Db, rootBookId: string, excludeFamilyId: string): Promise<number> => {
    const row = one(await db<{ count: number }[]>`
        select count(distinct target_family_id)::int as count from book_shares
        where root_book_id = ${rootBookId} and status in ${db(ACTIVE_SHARE_STATUSES)} and target_family_id <> ${excludeFamilyId}
    `)
    return row.count
}

export const assertRoomForFamily = async (db: Db, rootBookId: string, targetFamilyId: string): Promise<void> => {
    if ((await countSharedFamilies(db, rootBookId, targetFamilyId)) >= MAX_FAMILIES_PER_BOOK) {
        throw createError({ statusCode: 409, statusMessage: 'This book is already shared with the maximum number of families' })
    }
}

export const notifyParents = async (db: Db, familyId: string, kind: NotificationKind, payload: Record<string, string | number>, groupKey?: string): Promise<void> => {
    await notify(db, { familyId, recipientMemberId: null, kind, payload, groupKey })
}

export const familyName = async (db: Db, familyId: string): Promise<string> => {
    const [row] = await db<{ name: string }[]>`select name from families where id = ${familyId}`
    return row?.name ?? ''
}

export const memberName = async (db: Db, memberId: string | null): Promise<string> => {
    if (memberId === null) {
        return ''
    }
    const [row] = await db<{ name: string }[]>`select name from members where id = ${memberId}`
    return row?.name ?? ''
}

export const bookTitle = async (db: Db, bookId: string): Promise<string> => {
    const [row] = await db<{ title: string }[]>`select title from books where id = ${bookId}`
    return row?.title ?? ''
}

export const copyBookToFamily = async (tx: Db, bookId: string, ownerFamilyId: string, targetFamilyId: string): Promise<string> => {
    const [source] = await tx<{ originBookId: string | null; originFamilyId: string | null }[]>`
        select origin_book_id, origin_family_id from books where id = ${bookId} and family_id = ${ownerFamilyId}
    `
    if (!source) {
        return notFound('Book not found')
    }
    const created = one(await tx<{ id: string }[]>`
        insert into books (family_id, title, subtitle, author, illustrator, age_min, age_max, language, written_language, voice_languages, moods, themes, type, tts_fallback, image_desc, kind, status, origin_book_id, origin_family_id)
        select ${targetFamilyId}, title, subtitle, author, illustrator, age_min, age_max, language, written_language, voice_languages, moods, themes, type, tts_fallback, image_desc, 'multi', 'to_record',
            coalesce(origin_book_id, id), coalesce(origin_family_id, family_id)
        from books where id = ${bookId} and family_id = ${ownerFamilyId}
        returning id
    `)
    await tx`
        insert into book_pages (family_id, book_id, position, file_id, kind, tts_fallback, description)
        select ${targetFamilyId}, ${created.id}, position, null, case when kind = 'cover' then 'cover' else 'empty' end, tts_fallback, description
        from book_pages where book_id = ${bookId}
    `
    await tx`
        insert into panels (family_id, book_id, page_id, position, description)
        select ${targetFamilyId}, ${created.id}, np.id, p.position, p.description
        from panels p
        join book_pages op on op.id = p.page_id
        join book_pages np on np.book_id = ${created.id} and np.position = op.position
        where p.book_id = ${bookId}
    `
    await tx`
        insert into characters (family_id, book_id, name, color, description, is_narrator, position)
        select ${targetFamilyId}, ${created.id}, name, color, description, is_narrator, position from characters where book_id = ${bookId}
    `
    await tx`
        insert into lines (family_id, book_id, position, page_index, character, text, note, tone, scene_description, character_id, panel_id)
        select ${targetFamilyId}, ${created.id}, l.position, l.page_index, l.character, l.text, l.note, l.tone, l.scene_description, nc.id, np.id
        from lines l
        left join characters oc on oc.id = l.character_id
        left join characters nc on nc.book_id = ${created.id} and lower(nc.name) = lower(oc.name)
        left join panels op on op.id = l.panel_id
        left join book_pages opage on opage.id = op.page_id
        left join book_pages npage on npage.book_id = ${created.id} and npage.position = opage.position
        left join panels np on np.page_id = npage.id and np.position = op.position
        where l.book_id = ${bookId} order by l.position
    `
    await tx`
        insert into line_translations (line_id, family_id, language, text, tone)
        select nl.id, ${targetFamilyId}, t.language, t.text, t.tone
        from line_translations t
        join lines ol on ol.id = t.line_id
        join lines nl on nl.book_id = ${created.id} and nl.position = ol.position
        where ol.book_id = ${bookId}
    `
    return created.id
}

export const requireRecordShare = async (db: Db, actor: IActor, shareId: string): Promise<IShareRow> => {
    const share = await loadShareRow(db, shareId)
    const isRecorder = actor.role === 'parent' || (share.recorderMemberId !== null && share.recorderMemberId === actor.memberId)
    if (share.mode !== 'record' || share.status !== 'accepted' || share.targetFamilyId !== actor.familyId || !isRecorder) {
        return notFound('Share not found')
    }
    return share
}

export const findOrCreateGuestVoice = async (db: Db, ownerFamilyId: string, sourceFamilyId: string, sourceMemberId: string): Promise<{ id: string; status: MemberStatus; voicePolicy: VoicePolicy }> => {
    const [source] = await db<{ name: string; color: string }[]>`
        select name, color from members where id = ${sourceMemberId} and family_id = ${sourceFamilyId}
    `
    if (!source) {
        return notFound('Member not found')
    }
    return one(await db<{ id: string; status: MemberStatus; voicePolicy: VoicePolicy }[]>`
        insert into members (family_id, name, role, color, source_family_id, source_member_id)
        values (${ownerFamilyId}, ${source.name}, 'relative', ${source.color}, ${sourceFamilyId}, ${sourceMemberId})
        on conflict (family_id, source_member_id) where source_member_id is not null
        do update set name = excluded.name, color = excluded.color, deleted_at = null
        returning id, status, voice_policy
    `)
}
