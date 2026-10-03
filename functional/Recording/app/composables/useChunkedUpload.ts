import type { IUploadState } from '~~/shared/types/upload'
import { UPLOAD_OFFSET_HEADER } from '~~/shared/utils/upload'

const MAX_ATTEMPTS = 8
const BASE_DELAY_MS = 400
const MAX_DELAY_MS = 8000
const FATAL_STATUSES = [400, 401, 403, 404, 409, 410, 413]

export interface IUploadHooks {
    uploadId?: string | null
    onSession?: (id: string) => void | Promise<void>
}

const statusOf = (error: unknown): number | undefined => (error as { statusCode?: number }).statusCode

const offsetOf = (error: unknown): number | undefined => (error as { data?: { data?: { offset?: number } } }).data?.data?.offset

export const isFatalUploadError = (error: unknown): boolean => {
    const status = statusOf(error)
    return status !== undefined && FATAL_STATUSES.includes(status)
}

const pause = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

export const useChunkedUpload = () => {
    const { request } = useApi()
    const progress = ref(0)

    const withRetry = async <T>(action: () => Promise<T>): Promise<T> => {
        let attempt = 0
        for (;;) {
            try {
                return await action()
            } catch (error) {
                const status = statusOf(error)
                attempt += 1
                if ((status !== undefined && FATAL_STATUSES.includes(status)) || attempt >= MAX_ATTEMPTS) {
                    throw error
                }
                await pause(Math.min(BASE_DELAY_MS * 2 ** (attempt - 1), MAX_DELAY_MS))
            }
        }
    }

    const openSession = async (blob: Blob, mime: string, hooks: IUploadHooks): Promise<IUploadState> => {
        if (hooks.uploadId) {
            try {
                return await request<IUploadState>(`/uploads/${hooks.uploadId}`)
            } catch (error) {
                const status = statusOf(error)
                if (status === undefined || !FATAL_STATUSES.includes(status)) {
                    throw error
                }
            }
        }
        const created = await withRetry(() => request<IUploadState>('/uploads', { method: 'POST', body: { size: blob.size, mime } }))
        await hooks.onSession?.(created.id)
        return created
    }

    const upload = async (blob: Blob, mime: string, hooks: IUploadHooks = {}): Promise<string> => {
        progress.value = 0
        const session = await openSession(blob, mime, hooks)
        const path = `/uploads/${session.id}`
        let offset = session.offset
        while (offset < blob.size) {
            const start = offset
            const chunk = blob.slice(start, start + session.chunkSize)
            try {
                const state = await withRetry(() =>
                    request<IUploadState>(path, {
                        method: 'PATCH',
                        body: chunk,
                        headers: { 'content-type': 'application/octet-stream', [UPLOAD_OFFSET_HEADER]: String(start) },
                    }),
                )
                offset = state.offset
            } catch (error) {
                const known = statusOf(error) === 409 ? offsetOf(error) : undefined
                if (known === undefined) {
                    const state = await withRetry(() => request<IUploadState>(path))
                    if (state.offset <= start) {
                        throw error
                    }
                    offset = state.offset
                } else {
                    offset = known
                }
            }
            progress.value = offset / blob.size
        }
        const file = await withRetry(() => request<{ id: string }>(`${path}/finish`, { method: 'POST' }))
        progress.value = 1
        return file.id
    }

    return { upload, progress }
}
