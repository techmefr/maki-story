export interface ITreasure {
    id: string
    childId: string
    sourceMessageId: string | null
    fromMemberId: string | null
    fileId: string
    mime: string
    durationMs: number
    savedByMemberId: string | null
    createdAt: string
}

export interface ITreasureBox {
    items: ITreasure[]
    limit: number
}
