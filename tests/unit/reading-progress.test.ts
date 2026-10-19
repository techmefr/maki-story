import assert from 'node:assert/strict'
import { test } from 'node:test'
import { normalizeReadingProgress } from '../../shared/utils/readingProgress.ts'

const pages = [0, 2, 4]
const steps: IPlaybackStep[] = [{ lineId: 'first', pageIndex: 0, panelId: null, language: 'fr', fileId: 'audio', durationMs: 1000, memberId: 'parent', isFallback: false }]

test('resumes a silent page even though it has no recorded steps', () => {
    assert.deepEqual(normalizeReadingProgress({ pageIndex: 1, lineIndex: 0, positionMs: 0 }, pages, steps), { pageIndex: 1, lineIndex: 0, positionMs: 0 })
})

test('restores the correct line and position for a recorded page', () => {
    assert.deepEqual(normalizeReadingProgress({ pageIndex: 0, lineIndex: 0, positionMs: 300 }, pages, steps), { pageIndex: 0, lineIndex: 0, positionMs: 300 })
})

test('rejects removed pages and clamps changed audio durations or invalid lines', () => {
    assert.equal(normalizeReadingProgress({ pageIndex: 5, lineIndex: 0, positionMs: 0 }, pages, steps), null)
    assert.equal(normalizeReadingProgress({ pageIndex: -1, lineIndex: 0, positionMs: 0 }, pages, steps), null)
    assert.deepEqual(normalizeReadingProgress({ pageIndex: 0, lineIndex: 9, positionMs: 5000 }, pages, steps), { pageIndex: 0, lineIndex: 0, positionMs: 0 })
    assert.deepEqual(normalizeReadingProgress({ pageIndex: 0, lineIndex: 0, positionMs: NaN }, pages, steps), { pageIndex: 0, lineIndex: 0, positionMs: 0 })
})
