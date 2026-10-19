import assert from 'node:assert/strict'
import { test } from 'node:test'
import { offlineMediaIds } from '../../shared/utils/offlineMedia.ts'

test('offline reading carries every voice and translation without duplicating files or downloading child page scans', () => {
    const book = { lines: [{ audioFileId: 'voice-fr' }, { audioFileId: null }], recordings: [{ fileId: 'voice-fr' }, { fileId: 'voice-mg' }, { fileId: 'other-reader' }], pages: [{ fileId: 'scan' }, { fileId: null }] }
    assert.deepEqual(offlineMediaIds(book, false), ['voice-fr', 'voice-mg', 'other-reader'])
    assert.deepEqual(offlineMediaIds(book, true), ['voice-fr', 'voice-mg', 'other-reader', 'scan'])
})
