export const MAX_PLAYBACK_LANGUAGES = 8

export const parseLanguageList = (value: unknown): string[] | null => {
    const items = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : null
    if (items === null || items.length === 0 || items.length > MAX_PLAYBACK_LANGUAGES) {
        return null
    }
    return items.every(isLanguageCode) ? (items as string[]) : null
}

export const buildPlaybackSteps = (
    lines: IPlanLine[],
    recordings: IPlanRecording[],
    languages: string[],
    bookLanguage: string,
): IPlaybackStep[] => {
    const steps: IPlaybackStep[] = []
    for (const line of lines) {
        const own = recordings.filter(item => item.lineId === line.id && item.status !== 'stale')
        const toStep = (recording: IPlanRecording, isFallback: boolean): IPlaybackStep => ({
            lineId: line.id,
            pageIndex: line.pageIndex,
            panelId: line.panelId,
            language: recording.language,
            fileId: recording.fileId,
            durationMs: recording.durationMs,
            memberId: recording.memberId,
            isFallback,
        })
        const picked: IPlaybackStep[] = []
        for (const language of languages) {
            const recording = own.find(item => item.language === language)
            if (recording && picked[picked.length - 1]?.language !== language) {
                picked.push(toStep(recording, false))
            }
        }
        if (picked.length === 0) {
            const fallback = own.find(item => item.language === bookLanguage)
            if (fallback) {
                picked.push(toStep(fallback, true))
            }
        }
        steps.push(...picked)
    }
    return steps
}
