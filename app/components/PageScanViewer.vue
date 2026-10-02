<template>
    <section class="scan" :class="{ 'scan--full': isFull }" :aria-label="t('pageView.scan.label')" data-testid="scan-viewer" @keydown="onKey">
        <div class="scan__bar row row--wrap">
            <button type="button" class="btn btn--white btn--small scan__btn" :disabled="scale <= 1" :aria-label="t('pageView.scan.zoomOut')" @click="zoomBy(1 / ZOOM_STEP)">
                <AppIcon name="zoom-out" :size="22" />
            </button>
            <button type="button" class="btn btn--white btn--small scan__btn" :aria-label="t('pageView.scan.zoomIn')" data-testid="scan-zoom-in" @click="zoomBy(ZOOM_STEP)">
                <AppIcon name="zoom-in" :size="22" />
            </button>
            <button type="button" class="btn btn--white btn--small scan__btn" :aria-label="t('pageView.scan.rotate')" data-testid="scan-rotate" @click="rotate">
                <AppIcon name="rotate" :size="22" />
            </button>
            <button type="button" class="btn btn--white btn--small scan__btn" :disabled="isIdentity" :aria-label="t('pageView.scan.reset')" @click="reset">
                <AppIcon name="redo" :size="22" />
            </button>
            <button
                type="button"
                class="btn btn--white btn--small scan__btn"
                :aria-pressed="isFull"
                :aria-label="isFull ? t('pageView.scan.exitFull') : t('pageView.scan.full')"
                data-testid="scan-full"
                @click="toggleFull"
            >
                <AppIcon :name="isFull ? 'close' : 'maximize'" :size="22" />
            </button>
        </div>
        <div
            class="scan__viewport"
            tabindex="0"
            role="img"
            :aria-label="alt"
            @pointerdown="onDown"
            @pointermove="onMove"
            @pointerup="onUp"
            @pointercancel="onCancel"
            @wheel.prevent="onWheel"
        >
            <div ref="stage" class="scan__stage" :class="{ 'scan__stage--animated': isSettled }" :style="stageStyle" data-testid="scan-stage">
                <img v-if="src" :src="src" :alt="alt" class="scan__img" draggable="false" data-testid="scan-image" />
                <p v-else-if="hasFailed" class="muted scan__state" role="status">{{ t('pageView.scan.failed') }}</p>
                <p v-else class="muted scan__state" role="status">{{ t('common.loading') }}</p>
            </div>
        </div>
        <p v-if="hasPanels" class="muted scan__hint">{{ t('pageView.scan.panelHint') }}</p>
    </section>
</template>

<script setup lang="ts">
const props = defineProps<{ fileId: string; panelCount?: number; panels?: IScanRect[]; alt: string }>()

const PAN_STEP_PX = 40
const PANEL_ZOOM = 2.5

const { t } = useI18n()
const { fetchUrl } = useFiles()

const stage = ref<HTMLElement | null>(null)
const src = ref('')
const hasFailed = ref(false)
const isFull = ref(false)
const isSharp = ref(false)
const scale = ref(1)
const x = ref(0)
const y = ref(0)
const angle = ref(0)
const isSettled = ref(true)

const rects = computed(() => (props.panels && props.panels.length > 0 ? props.panels : fallbackPanelRects(props.panelCount ?? 0)))
const hasPanels = computed(() => rects.value.length > 0)
const isIdentity = computed(() => scale.value === 1 && x.value === 0 && y.value === 0 && angle.value === 0)
const stageStyle = computed(() => ({ transform: `translate(${x.value}px, ${y.value}px) rotate(${angle.value}deg) scale(${scale.value})` }))

const pointers = new Map<number, { x: number; y: number }>()
let pinchDistance = 0
let tapStart = { x: 0, y: 0, at: 0 }
let lastTapAt = 0
let isMoved = false

const stageSize = (): { width: number; height: number } => ({ width: stage.value?.offsetWidth ?? 0, height: stage.value?.offsetHeight ?? 0 })

const apply = (next: IViewTransform): void => {
    const { width, height } = stageSize()
    scale.value = clampScale(next.scale)
    x.value = scale.value === 1 ? 0 : clampPan(next.x, scale.value, width)
    y.value = scale.value === 1 ? 0 : clampPan(next.y, scale.value, height)
}

const zoomBy = (factor: number): void => apply({ scale: scale.value * factor, x: x.value * factor, y: y.value * factor })

const rotate = (): void => {
    angle.value = (angle.value + 90) % 360
    apply({ scale: scale.value, x: x.value, y: y.value })
}

const reset = (): void => {
    angle.value = 0
    apply({ scale: 1, x: 0, y: 0 })
}

const loadSharp = async (): Promise<void> => {
    if (isSharp.value) {
        return
    }
    isSharp.value = true
    try {
        src.value = await fetchUrl(props.fileId, 'full')
    } catch (error) {
        console.warn('La version nette de la page n a pas pu être chargée', error)
    }
}

watch(scale, value => {
    if (value >= SHARP_SCALE) {
        void loadSharp()
    }
})

const load = async (): Promise<void> => {
    hasFailed.value = false
    isSharp.value = false
    try {
        src.value = await fetchUrl(props.fileId)
    } catch (error) {
        console.warn('La page scannée n a pas pu être chargée', error)
        hasFailed.value = true
    }
}

watch(
    () => props.fileId,
    () => {
        reset()
        void load()
    },
    { immediate: true },
)

const normalized = (event: PointerEvent): { x: number; y: number } | null => {
    const box = stage.value?.getBoundingClientRect()
    if (!box || angle.value !== 0 || box.width === 0) {
        return null
    }
    return { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height }
}

const handleTap = (event: PointerEvent): void => {
    const now = Date.now()
    if (now - lastTapAt < DOUBLE_TAP_MS) {
        lastTapAt = 0
        apply({ scale: scale.value > 1 ? 1 : PANEL_ZOOM, x: 0, y: 0 })
        return
    }
    lastTapAt = now
    if (scale.value !== 1 || !hasPanels.value) {
        return
    }
    const point = normalized(event)
    const hit = point ? hitRect(rects.value, point.x, point.y) : null
    if (hit) {
        const { width, height } = stageSize()
        apply(focusRect(hit, width, height))
    }
}

const onDown = (event: PointerEvent): void => {
    ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    isSettled.value = false
    if (pointers.size === 1) {
        tapStart = { x: event.clientX, y: event.clientY, at: Date.now() }
        isMoved = false
    }
    if (pointers.size === 2) {
        const [a, b] = [...pointers.values()]
        pinchDistance = Math.hypot(a!.x - b!.x, a!.y - b!.y)
        isMoved = true
    }
}

const onMove = (event: PointerEvent): void => {
    const previous = pointers.get(event.pointerId)
    if (!previous) {
        return
    }
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointers.size >= 2) {
        const [a, b] = [...pointers.values()]
        const distance = Math.hypot(a!.x - b!.x, a!.y - b!.y)
        if (pinchDistance > 0) {
            const factor = distance / pinchDistance
            apply({ scale: scale.value * factor, x: x.value * factor, y: y.value * factor })
        }
        pinchDistance = distance
        return
    }
    if (Math.hypot(event.clientX - tapStart.x, event.clientY - tapStart.y) > TAP_SLOP_PX) {
        isMoved = true
    }
    if (scale.value > 1 && isMoved) {
        apply({ scale: scale.value, x: x.value + event.clientX - previous.x, y: y.value + event.clientY - previous.y })
    }
}

const onUp = (event: PointerEvent): void => {
    const wasSingle = pointers.size === 1
    pointers.delete(event.pointerId)
    pinchDistance = 0
    isSettled.value = true
    if (wasSingle && !isMoved && Date.now() - tapStart.at < 500) {
        handleTap(event)
    }
}

const onCancel = (event: PointerEvent): void => {
    pointers.delete(event.pointerId)
    pinchDistance = 0
    isSettled.value = true
}

const onWheel = (event: WheelEvent): void => {
    zoomBy(event.deltaY < 0 ? 1.15 : 1 / 1.15)
}

const onKey = (event: KeyboardEvent): void => {
    const moves: Record<string, [number, number]> = {
        ArrowLeft: [PAN_STEP_PX, 0],
        ArrowRight: [-PAN_STEP_PX, 0],
        ArrowUp: [0, PAN_STEP_PX],
        ArrowDown: [0, -PAN_STEP_PX],
    }
    const move = moves[event.key]
    if (event.key === '+' || event.key === '=') {
        event.preventDefault()
        zoomBy(ZOOM_STEP)
    } else if (event.key === '-') {
        event.preventDefault()
        zoomBy(1 / ZOOM_STEP)
    } else if (event.key === '0') {
        event.preventDefault()
        reset()
    } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        rotate()
    } else if (move && scale.value > 1) {
        event.preventDefault()
        apply({ scale: scale.value, x: x.value + move[0], y: y.value + move[1] })
    }
}

const toggleFull = (): void => {
    isFull.value = !isFull.value
    reset()
}

const onDocumentKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && isFull.value) {
        isFull.value = false
        reset()
    }
}

onMounted(() => document.addEventListener('keydown', onDocumentKey))
onBeforeUnmount(() => document.removeEventListener('keydown', onDocumentKey))
</script>

<style scoped>
.scan {
    display: grid;
    gap: 8px;
}

.scan--full {
    position: fixed;
    inset: 0;
    z-index: 200;
    background: var(--cream);
    padding: max(12px, env(safe-area-inset-top)) 12px max(12px, env(safe-area-inset-bottom));
    grid-template-rows: auto 1fr auto;
}

.scan__bar {
    gap: 8px;
}

.scan__btn {
    min-width: 48px;
    min-height: 48px;
}

.scan__viewport {
    overflow: hidden;
    border: 2.5px solid var(--ink);
    border-radius: 16px;
    box-shadow: var(--shadow);
    background: var(--paper);
    display: grid;
    place-items: center;
    touch-action: none;
    max-height: 60vh;
    min-height: 120px;
}

.scan--full .scan__viewport {
    max-height: none;
    height: 100%;
}

.scan__viewport:focus-visible {
    outline: 4px solid var(--ink);
    outline-offset: 3px;
}

.scan__stage {
    max-width: 100%;
    transform-origin: center;
}

.scan__stage--animated {
    transition: transform 0.2s ease;
}

.scan__img {
    display: block;
    max-width: 100%;
    max-height: 60vh;
    user-select: none;
}

.scan--full .scan__img {
    max-height: calc(100vh - 160px);
}

.scan__state {
    margin: 0;
    padding: 24px;
}

.scan__hint {
    margin: 0;
    font-size: 0.875rem;
}

@media (prefers-reduced-motion: reduce) {
    .scan__stage--animated {
        transition: none;
    }
}
</style>
