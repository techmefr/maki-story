<template>
    <div class="stack scanner">
        <video ref="video" class="scanner__video" autoplay playsinline muted />
        <p v-if="hasFailed" class="error" role="alert">{{ t('addBook.scanFailed') }}</p>
    </div>
</template>

<script setup lang="ts">
const SCAN_INTERVAL_MS = 400

interface IBarcodeDetector {
    detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>
}

const emit = defineEmits<{ detected: [isbn: string] }>()

const { t } = useI18n()
const video = ref<HTMLVideoElement | null>(null)
const hasFailed = ref(false)

let stream: MediaStream | null = null
let timer: ReturnType<typeof setInterval> | null = null

const stop = (): void => {
    if (timer) {
        clearInterval(timer)
        timer = null
    }
    stream?.getTracks().forEach(track => track.stop())
    stream = null
}

onMounted(async () => {
    const Detector = (window as unknown as { BarcodeDetector?: new (options: { formats: string[] }) => IBarcodeDetector }).BarcodeDetector
    if (!Detector || !video.value) {
        hasFailed.value = true
        return
    }
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        video.value.srcObject = stream
        const detector = new Detector({ formats: ['ean_13'] })
        timer = setInterval(async () => {
            if (!video.value) {
                return
            }
            const found = await detector.detect(video.value)
            const code = found[0]?.rawValue
            if (code) {
                stop()
                emit('detected', code)
            }
        }, SCAN_INTERVAL_MS)
    } catch (_error) {
        hasFailed.value = true
    }
})

onBeforeUnmount(stop)
</script>

<style scoped>
.scanner__video {
    width: 100%;
    aspect-ratio: 4 / 3;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--ink);
    object-fit: cover;
}
</style>
