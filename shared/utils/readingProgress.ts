import type { IPlaybackProgress, IPlaybackStep } from '../types/playback'

export const normalizeReadingProgress = (saved: IPlaybackProgress | null, pages: number[], steps: IPlaybackStep[]): IPlaybackProgress | null => {
    if (!saved || !Number.isInteger(saved.pageIndex) || saved.pageIndex < 0 || saved.pageIndex >= pages.length) {
        return null
    }
    const lines = steps.filter(step => step.pageIndex === pages[saved.pageIndex])
    if (lines.length === 0) {
        return { pageIndex: saved.pageIndex, lineIndex: 0, positionMs: 0 }
    }
    const isLineValid = Number.isInteger(saved.lineIndex) && saved.lineIndex >= 0 && saved.lineIndex < lines.length
    const lineIndex = isLineValid ? saved.lineIndex : 0
    const duration = lines[lineIndex]?.durationMs ?? 0
    const positionMs = isLineValid && Number.isFinite(saved.positionMs) ? Math.max(0, Math.min(Math.round(saved.positionMs), Math.max(0, duration - 1))) : 0
    return { pageIndex: saved.pageIndex, lineIndex, positionMs }
}
