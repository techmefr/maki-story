export const MAX_RECORDING_MS = 10 * 60 * 1000
export const RECORDING_BITS_PER_SECOND = 24000
export const RECORDING_SAMPLE_RATE = 16000
export const MIN_RECORDING_MS = 500
export const RECORDING_MIMES = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4', 'audio/webm']
export const RECORDING_LIMIT_OVERRIDE_KEY = '__TANTARA_MAX_RECORDING_MS__'

export const resolveRecordingLimitMs = (override: unknown): number => {
    return typeof override === 'number' && override > 0 ? override : MAX_RECORDING_MS
}
