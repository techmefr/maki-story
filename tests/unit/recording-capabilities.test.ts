import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pickRecordingMime } from '../../shared/utils/recording.ts'

test('recording prefers Opus and stays available on an AAC-only WebKit device', () => {
    assert.equal(pickRecordingMime(mime => mime.includes('opus') || mime === 'audio/mp4'), 'audio/webm;codecs=opus')
    assert.equal(pickRecordingMime(mime => mime === 'audio/ogg;codecs=opus'), 'audio/ogg;codecs=opus')
    assert.equal(pickRecordingMime(mime => mime === 'audio/mp4'), 'audio/mp4')
    assert.equal(pickRecordingMime(() => false), null)
})
