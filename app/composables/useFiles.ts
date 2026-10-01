const urlCache = new Map<string, string>()

export const useFiles = () => {
    const config = useRuntimeConfig()
    const { request } = useApi()

    const chunked = useChunkedUpload()

    const upload = async (blob: Blob, mime: string): Promise<string> => {
        if (mime.startsWith('audio/')) {
            return chunked.upload(blob, mime)
        }
        const result = await request<{ id: string }>('/files', {
            method: 'POST',
            body: blob,
            headers: { 'content-type': mime },
        })
        return result.id
    }

    const fetchUrl = async (fileId: string): Promise<string> => {
        const cached = urlCache.get(fileId)
        if (cached) {
            return cached
        }
        const saved = await readOfflineFile(fileId).catch(() => null)
        if (saved) {
            const savedUrl = URL.createObjectURL(saved)
            urlCache.set(fileId, savedUrl)
            return savedUrl
        }
        const response = await fetch(`${config.public.apiBase}/api/files/${fileId}`, {
            credentials: 'include',
        })
        if (!response.ok) {
            throw new Error('Fichier introuvable')
        }
        const url = URL.createObjectURL(await response.blob())
        urlCache.set(fileId, url)
        return url
    }

    const forget = (fileId: string): void => {
        const cached = urlCache.get(fileId)
        if (cached) {
            URL.revokeObjectURL(cached)
            urlCache.delete(fileId)
        }
    }

    return { upload, uploadProgress: chunked.progress, fetchUrl, forget }
}
