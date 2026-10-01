<template>
    <div class="stack center capture">
        <div class="capture__frame" :style="{ borderColor: frameColor }">
            <video v-show="phase === 'live'" ref="video" class="capture__video" autoplay playsinline muted />
            <img v-if="phase === 'preview' && previewUrl" :src="previewUrl" alt="Ta grimace" class="capture__image" />
            <div v-if="phase === 'idle'" class="capture__placeholder">
                <AppMaki :size="90" />
            </div>
            <div v-if="countdown > 0" class="capture__count" role="status" aria-live="assertive">{{ countdown }}</div>
        </div>
        <div class="subtitle">{{ prompt }}</div>
        <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
        <template v-if="phase === 'idle'">
            <button type="button" class="btn btn--block" @click="openCamera"><AppIcon name="camera" :size="22" motion="wiggle" />Ouvrir la caméra</button>
        </template>
        <template v-else-if="phase === 'live'">
            <button type="button" class="btn btn--coral btn--block" :disabled="countdown > 0" @click="startCountdown">
                <AppIcon name="camera" :size="22" />
                {{ countdown > 0 ? 'Prépare ta grimace…' : 'Prendre la photo' }}
            </button>
        </template>
        <template v-else-if="phase === 'preview'">
            <div class="row" style="width: 100%">
                <button type="button" class="btn btn--white grow" @click="retake"><AppIcon name="redo" :size="20" />Refaire</button>
                <button type="button" class="btn btn--mint grow" @click="keep"><AppIcon name="check" :size="20" />Garder</button>
            </div>
        </template>
        <label v-if="phase !== 'preview'" class="btn btn--white btn--small">
            Choisir une photo
            <input type="file" accept="image/*" capture="user" hidden @change="pickFile" />
        </label>
    </div>
</template>

<script setup lang="ts">
const GRIMACES = [
    'Tire la langue !',
    'Fais des yeux de poisson !',
    'Gonfle tes joues !',
    'Fais ta plus grosse grimace !',
    'Fais semblant d’être un lémurien !',
    'Bouche en cœur et yeux qui louchent !',
]
const COUNTDOWN_START = 3
const COUNTDOWN_STEP_MS = 800
const OUTPUT_SIZE_PX = 480

const { frameColor = '#1F1B3A' } = defineProps<{ frameColor?: string }>()
const emit = defineEmits<{ captured: [blob: Blob] }>()

const video = ref<HTMLVideoElement | null>(null)
const phase = ref<'idle' | 'live' | 'preview'>('idle')
const countdown = ref(0)
const errorMessage = ref('')
const previewUrl = ref<string | null>(null)
const prompt = ref(GRIMACES[Math.floor(Math.random() * GRIMACES.length)] ?? 'Fais une grimace !')
let stream: MediaStream | null = null
let photo: Blob | null = null

const stopCamera = (): void => {
    stream?.getTracks().forEach(track => track.stop())
    stream = null
}

const openCamera = async (): Promise<void> => {
    errorMessage.value = ''
    if (!navigator.mediaDevices?.getUserMedia) {
        errorMessage.value = 'La caméra n’est pas disponible ici. Choisis plutôt une photo.'
        return
    }
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        phase.value = 'live'
        await nextTick()
        if (video.value) {
            video.value.srcObject = stream
            await video.value.play()
        }
    } catch (_error) {
        stopCamera()
        phase.value = 'idle'
        errorMessage.value = 'La caméra est bloquée. Autorise-la ou choisis une photo.'
    }
}

const toSquareBlob = async (source: CanvasImageSource, width: number, height: number, isMirrored: boolean): Promise<Blob> => {
    const side = Math.min(width, height)
    const canvas = document.createElement('canvas')
    canvas.width = OUTPUT_SIZE_PX
    canvas.height = OUTPUT_SIZE_PX
    const context = canvas.getContext('2d')
    if (!context) {
        throw new Error('Canvas indisponible')
    }
    if (isMirrored) {
        context.translate(OUTPUT_SIZE_PX, 0)
        context.scale(-1, 1)
    }
    context.drawImage(source, (width - side) / 2, (height - side) / 2, side, side, 0, 0, OUTPUT_SIZE_PX, OUTPUT_SIZE_PX)
    return encodeCanvas(canvas)
}

const showPreview = (blob: Blob): void => {
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
    }
    photo = blob
    previewUrl.value = URL.createObjectURL(blob)
    phase.value = 'preview'
}

const snap = async (): Promise<void> => {
    const element = video.value
    if (!element) {
        return
    }
    try {
        showPreview(await toSquareBlob(element, element.videoWidth, element.videoHeight, true))
        stopCamera()
    } catch (error) {
        console.error('La photo n a pas pu être prise', error)
        errorMessage.value = 'La photo n’a pas marché, réessaie.'
    }
}

const startCountdown = (): void => {
    countdown.value = COUNTDOWN_START
    const timer = setInterval(async () => {
        countdown.value -= 1
        if (countdown.value <= 0) {
            clearInterval(timer)
            await snap()
        }
    }, COUNTDOWN_STEP_MS)
}

const pickFile = async (event: Event): Promise<void> => {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) {
        return
    }
    try {
        const bitmap = await createImageBitmap(file)
        showPreview(await toSquareBlob(bitmap, bitmap.width, bitmap.height, false))
        stopCamera()
    } catch (error) {
        console.error('La photo choisie n a pas pu être lue', error)
        errorMessage.value = 'Cette photo n’a pas pu être lue.'
    }
}

const retake = async (): Promise<void> => {
    photo = null
    await openCamera()
}

const keep = (): void => {
    if (photo) {
        emit('captured', photo)
    }
}

onBeforeUnmount(() => {
    stopCamera()
    if (previewUrl.value) {
        URL.revokeObjectURL(previewUrl.value)
    }
})
</script>

<style scoped>
.capture {
    width: 100%;
}

.capture__frame {
    position: relative;
    width: min(260px, 70vw);
    aspect-ratio: 1;
    border: 5px solid var(--ink);
    border-radius: 50%;
    box-shadow: var(--shadow-lg);
    overflow: hidden;
    background: var(--cream);
    display: flex;
    align-items: center;
    justify-content: center;
}

.capture__video,
.capture__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.capture__video {
    transform: scaleX(-1);
}

.capture__count {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font: 700 6rem/1 var(--font-title);
    color: var(--paper);
    text-shadow: 4px 4px 0 var(--ink);
}
</style>
