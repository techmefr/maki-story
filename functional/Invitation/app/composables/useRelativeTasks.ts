export interface IRelativeTask {
    key: string
    familyId: string
    familyName: string
    title: string
    subtitle: string
    path: string
    action: string
    comment: string
    author: string
}

export const useRelativeTasks = () => {
    const { flow } = useRelativeFlow()
    const { t } = useI18n()

    const recordingTasks = computed<IRelativeTask[]>(() => flow.value.families.flatMap(family => family.requests.map(item => ({
        key: `${family.familyId}-${item.kind}-${item.bookId}-${item.shareId ?? ''}`,
        familyId: family.familyId,
        familyName: family.familyName,
        title: item.bookTitle,
        subtitle: t('relative.requestMeta', { count: item.lineCount, family: family.familyName }),
        path: item.kind === 'share' && item.shareId ? `/sharing/${item.shareId}` : `/books/${item.bookId}/studio`,
        action: t('relative.record'),
        comment: '',
        author: '',
    }))))
    const proposedTasks = computed<IRelativeTask[]>(() => flow.value.families.flatMap(family => family.proposals.map(item => ({
        key: `${family.familyId}-${item.shareId}`,
        familyId: family.familyId,
        familyName: family.familyName,
        title: item.bookTitle,
        subtitle: t('relative.cardFamily', { family: family.familyName }),
        path: `/sharing/${item.shareId}`,
        action: t(`relative.proposalStatus.${item.status}`),
        comment: '',
        author: '',
    }))))
    const correctionTasks = computed<IRelativeTask[]>(() => flow.value.families.flatMap(family => family.fixes.map(item => ({
        key: `${family.familyId}-${item.bookId}`,
        familyId: family.familyId,
        familyName: family.familyName,
        title: item.bookTitle,
        subtitle: `${t('relative.fixTakes', { count: item.takeCount })} · ${family.familyName}`,
        path: `/books/${item.bookId}/studio`,
        action: t('relative.redo'),
        comment: item.comment,
        author: item.authorName,
    }))))

    return { recordingTasks, proposedTasks, correctionTasks }
}
