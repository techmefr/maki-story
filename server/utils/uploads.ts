import type { H3Event } from 'h3'
import type { Sql, TransactionSql } from 'postgres'
import type { IUploadState } from '../../shared/types/upload'
import { UPLOAD_CHUNK_BYTES } from '../../shared/utils/upload'
import type { IActor } from './permissions'
import { notFound, requireParam } from './validate'

export interface IUploadSession {
    id: string
    familyId: string
    mime: string
    size: number
    received: number
}

export const toUploadState = (session: IUploadSession): IUploadState => ({
    id: session.id,
    offset: session.received,
    size: session.size,
    chunkSize: UPLOAD_CHUNK_BYTES,
})

export const loadUploadSession = async (
    db: Sql | TransactionSql,
    event: H3Event,
    actor: IActor,
    lock = false,
): Promise<IUploadSession> => {
    const id = requireParam(event, 'id')
    const rows = lock
        ? await db<IUploadSession[]>`
            select id, family_id, mime, size, received from upload_sessions
            where id = ${id} and family_id = ${actor.familyId} and member_id is not distinct from ${actor.memberId}::text for update
        `
        : await db<IUploadSession[]>`
            select id, family_id, mime, size, received from upload_sessions
            where id = ${id} and family_id = ${actor.familyId} and member_id is not distinct from ${actor.memberId}::text
        `
    const [session] = rows
    if (!session) {
        return notFound('Upload not found')
    }
    return session
}

export const assertUploadLive = async (db: Sql | TransactionSql, session: IUploadSession): Promise<void> => {
    const [row] = await db<{ expired: boolean }[]>`select expires_at < now() as expired from upload_sessions where id = ${session.id}`
    if (row?.expired) {
        await db`delete from upload_sessions where id = ${session.id}`
        throw createError({ statusCode: 410, statusMessage: 'Upload expired' })
    }
}
