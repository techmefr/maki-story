export type TrashItemType = 'book' | 'member' | 'message' | 'treasure' | 'recordings'

export interface ITrashItem {
    type: TrashItemType
    id: string
    label: string
    detail: string
    count: number
    deletedAt: string
    restoreUntil: string
}

export interface ITrashRestoreBody {
    type: TrashItemType
    id: string
}

export interface IActivityEntry {
    id: string
    action: string
    entityType: string | null
    entityId: string | null
    actorName: string | null
    outcome: 'SUCCESS' | 'DENIED' | 'FAILURE'
    createdAt: string
}

export interface IActivityPage {
    items: IActivityEntry[]
    total: number
}

export interface IClientErrorBody {
    route?: string
    message?: string
    appVersion?: string
}

export interface IAdminLogEntry {
    source: 'SERVER' | 'CLIENT'
    route: string
    method: string
    status: number | null
    message: string
    count: number
    lastSeenAt: string
}
