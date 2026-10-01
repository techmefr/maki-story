export interface IOfflineBook {
    id: string
    title: string
    book: IBook
    fileIds: string[]
    sizes: Record<string, number>
    savedAt: string
    isComplete: boolean
}

export interface IOfflineProgress {
    done: number
    total: number
}

export interface IStorageUsage {
    usedBytes: number | null
    quotaBytes: number | null
    isPersisted: boolean
}
