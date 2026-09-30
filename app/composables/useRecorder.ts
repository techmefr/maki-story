const TICK_MS = 100
const MIN_RECORDING_MS = 500
const PREFERRED_MIMES = ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm']

export interface IRecording {
    blob: Blob
    mime: string
    ms: number
}

const pickMime = (): string => {
    return PREFERRED_MIMES.find(mime => MediaRecorder.isTypeSupported(mime)) ?? ''
}

export const useRecorder = () => {
    const isRecording = ref(false)
    const elapsedMs = ref(0)
    const errorMessage = ref('')
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

    const start = async (): Promise<boolean> => {
        errorMessage.value = ''
        if (!navigator.mediaDevices || typeof MediaRecorder === 'undefined') {
            errorMessage.value = 'Ce navigateur ne permet pas d’enregistrer la voix.'
            return false
        }
        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mime = pickMime()
            recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
            chunks = []
            recorder.ondataavailable = event => {
                if (event.data.size > 0) {
                    chunks.push(event.data)
                }
            }
            recorder.onstop = () => {
                const ms = Date.now() - startedAt
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
            }, TICK_MS)
            return true
        } catch (_error) {
            releaseStream()
            errorMessage.value = 'Le micro est bloqué. Autorise-le dans les réglages du navigateur.'
            return false
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

    onBeforeUnmount(() => {
        if (recorder && recorder.state === 'recording') {
            recorder.onstop = null
            recorder.stop()
        }
        releaseStream()
    })

    return { isRecording, elapsedMs, errorMessage, start, stop }
}
