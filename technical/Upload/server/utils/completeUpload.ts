import type { TransactionSql } from 'postgres'

export const completeUpload = async (tx: TransactionSql, id: string, familyId: string, memberId: string | null): Promise<string> => {
    const [session] = await tx<{ received: number; size: number; mime: string; fileId: string | null }[]>`select received, size, mime, file_id as "fileId" from upload_sessions where id = ${id} and family_id = ${familyId} and member_id is not distinct from ${memberId}::text for update`
    if (!session || session.received !== session.size) {
        throw new Error('Upload is incomplete')
    }
    if (session.fileId) {
        return session.fileId
    }
    const [file] = await tx<{ id: string }[]>`
        insert into files (family_id, mime, data, created_by_member_id)
        select ${familyId}, ${session.mime}, string_agg(data, ''::bytea order by chunk_offset), ${memberId}
        from upload_chunks where upload_id = ${id}
        returning id
    `
    if (!file) {
        throw new Error('Upload assembly failed')
    }
    await tx`update upload_sessions set file_id = ${file.id} where id = ${id}`
    await tx`delete from upload_chunks where upload_id = ${id}`
    return file.id
}
