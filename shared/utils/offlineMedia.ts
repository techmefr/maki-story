interface IOfflineMediaSource {
    lines: { audioFileId: string | null }[]
    recordings: { fileId: string }[]
    pages: { fileId: string | null }[]
}

export const offlineMediaIds = (book: IOfflineMediaSource, includeImages: boolean): string[] => [...new Set([
    ...book.lines.map(line => line.audioFileId),
    ...book.recordings.map(recording => recording.fileId),
    ...(includeImages ? book.pages.map(page => page.fileId) : []),
].filter((id): id is string => typeof id === 'string' && id !== ''))]
