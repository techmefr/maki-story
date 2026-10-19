export interface IDailyDigestBatch {
    accountId: string
    itemIds: string[]
}

export interface IDailyDigestStore<T extends IDailyDigestBatch> {
    pending: () => Promise<T[]>
    claim: (batch: T, day: string) => Promise<boolean>
    deliver: (batch: T) => Promise<boolean>
    complete: (batch: T) => Promise<void>
}

export const runDailyDigests = async <T extends IDailyDigestBatch>(store: IDailyDigestStore<T>, now = new Date()): Promise<{ sent: number; failed: number }> => {
    const day = now.toISOString().slice(0, 10)
    let sent = 0
    let failed = 0
    for (const batch of await store.pending()) {
        if (batch.itemIds.length === 0 || !(await store.claim(batch, day))) {
            continue
        }
        try {
            if (await store.deliver(batch)) {
                await store.complete(batch)
                sent++
            } else {
                failed++
            }
        } catch (_error) {
            failed++
        }
    }
    return { sent, failed }
}
