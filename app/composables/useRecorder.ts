import {
    MIN_RECORDING_MS,
    RECORDING_BITS_PER_SECOND,
    RECORDING_LIMIT_OVERRIDE_KEY,
    RECORDING_MIMES,
    RECORDING_SAMPLE_RATE,
    resolveRecordingLimitMs,
} from '../../shared/utils/recording'

const TICK_MS = 100

export interface IRecording {
    blob: Blob
    mime: string
    ms: number
}

const pickMime = (): string => {
    return RECORDING_MIMES.find(mime => MediaRecorder.isTypeSupported(mime)) ?? ''
}

const openMicrophone = async (): Promise<MediaStream> => {
    const constraints: MediaTrackConstraints = {
        channelCount: 1,
        sampleRate: RECORDING_SAMPLE_RATE,
        echoCancellation: true,
        noiseSuppression: true,
    }
    try {
        return await navigator.mediaDevices.getUserMedia({ audio: constraints })
    } catch (error) {
        if ((error as DOMException).name === 'OverconstrainedError') {
            return navigator.mediaDevices.getUserMedia({ audio: true })
        }
        throw error
    }
}

export const useRecorder = (onLimit?: (recording: IRecording | null) => void) => {
    const isRecording = ref(false)
    const elapsedMs = ref(0)
    const errorMessage = ref('')
    const limitMs = ref(resolveRecordingLimitMs(undefined))
    const remainingMs = computed(() => Math.max(0, limitMs.value - elapsedMs.value))
    let recorder: MediaRecorder | null = null
    let stream: MediaStream | null = null
    let chunks: Blob[] = []
    let tickTimer: ReturnType<typeof setInterval> | null = null
    let startedAt = 0
    let resolveStop: ((recording: IRecording | null) => void) | null = null

    const releaseStream = (): void => {
        stream?.getTracks().forEach(track => track.stop())
        stream = null
        if (tickTimer) {
            clearInterval(tickTimer)
            tickTimer = null
        }
    }

    const stop = (): Promise<IRecording | null> => {
        return new Promise(resolve => {
            if (!recorder || recorder.state !== 'recording') {
                resolve(null)
                return
            }
            resolveStop = resolve
            recorder.stop()
        })
    }

    const start = async (): Promise<boolean> => {
        errorMessage.value = ''
        if (!navigator.mediaDevices || typeof MediaRecorder === 'undefined') {
            errorMessage.value = 'Ce navigateur ne permet pas d’enregistrer la voix.'
            return false
        }
        try {
            limitMs.value = resolveRecordingLimitMs((globalThis as Record<string, unknown>)[RECORDING_LIMIT_OVERRIDE_KEY])
            stream = await openMicrophone()
            const mime = pickMime()
            const options: MediaRecorderOptions = { audioBitsPerSecond: RECORDING_BITS_PER_SECOND }
            if (mime) {
                options.mimeType = mime
            }
            recorder = new MediaRecorder(stream, options)
            chunks = []
            recorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    chunks.push(event.data)
                }
            }
            recorder.onstop = () => {
                const ms = Math.min(Date.now() - startedAt, limitMs.value)
                const type = recorder?.mimeType || mime || 'audio/webm'
                releaseStream()
                isRecording.value = false
                const isTooShort = ms < MIN_RECORDING_MS || chunks.length === 0
                resolveStop?.(isTooShort ? null : { blob: new Blob(chunks, { type }), mime: type, ms })
                resolveStop = null
            }
            startedAt = Date.now()
            elapsedMs.value = 0
            recorder.start()
            isRecording.value = true
            tickTimer = setInterval(() => {
                elapsedMs.value = Date.now() - startedAt
                if (elapsedMs.value >= limitMs.value && tickTimer) {
                    clearInterval(tickTimer)
                    tickTimer = null
                    void stop().then(recording => onLimit?.(recording))
                }
            }, TICK_MS)
            return true
        } catch (_error) {
            releaseStream()
            errorMessage.value = 'Le micro est bloqué. Autorise-le dans les réglages du navigateur.'
            return false
        }
    }

    onBeforeUnmount(() => {
        if (recorder && recorder.state === 'recording') {
            recorder.onstop = null
            recorder.stop()
        }
        releaseStream()
    })

    return { isRecording, elapsedMs, remainingMs, limitMs, errorMessage, start, stop }
}
