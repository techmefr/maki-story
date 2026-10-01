export const reviewStateOf = (status: RecordingStatus | null): ReviewLineState => {
    if (status === null) {
        return 'missing'
    }
    if (status === 'stale') {
        return 'stale'
    }
    if (status === 'changes_requested') {
        return 'changes'
    }
    return status === 'approved' ? 'approved' : 'to_review'
}
