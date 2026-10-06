<template>
    <div id="dev-feedback-root" class="dfb">
        <button type="button" class="dfb__fab" :aria-label="t('devFeedback.open')" data-test-id="dev-feedback-open" @click="toggle">
            {{ openCount || '' }}
            <span aria-hidden="true">&#9998;</span>
        </button>

        <div v-if="isPointing" class="dfb__hint">{{ t('devFeedback.pointing') }}</div>
        <div v-if="hovered" class="dfb__outline" :style="hoverStyle"></div>

        <dialog ref="dialog" class="dfb__dialog" data-test-id="dev-feedback-dialog">
            <h2 class="dfb__title">{{ t('devFeedback.title') }}</h2>
            <p class="dfb__meta">{{ route }}</p>

            <button type="button" class="dfb__btn" data-test-id="dev-feedback-point" @click="startPointing">
                {{ target ? t('devFeedback.repoint') : t('devFeedback.point') }}
            </button>
            <p v-if="target" class="dfb__target">{{ target.selector }}<br />{{ target.text }}</p>

            <label class="dfb__label" for="dfb-category">{{ t('devFeedback.category') }}</label>
            <select id="dfb-category" v-model="category" class="dfb__field">
                <option v-for="name in CATEGORIES" :key="name" :value="name">{{ t(`devFeedback.categories.${name}`) }}</option>
            </select>

            <label class="dfb__label" for="dfb-comment">{{ t('devFeedback.comment') }}</label>
            <textarea id="dfb-comment" v-model="comment" class="dfb__field" rows="4" data-test-id="dev-feedback-comment"></textarea>

            <p v-if="error" class="dfb__error">{{ error }}</p>
            <div class="dfb__row">
                <button type="button" class="dfb__btn" @click="close">{{ t('devFeedback.close') }}</button>
                <button type="button" class="dfb__btn dfb__btn--primary" :disabled="!comment.trim() || isSending" data-test-id="dev-feedback-send" @click="send">
                    {{ t('devFeedback.send') }}
                </button>
            </div>

            <h3 class="dfb__subtitle">{{ t('devFeedback.list', { count: items.length }) }}</h3>
            <ul class="dfb__list">
                <li v-for="item in sortedItems" :key="item.id" class="dfb__item" :data-status="item.status">
                    <strong>{{ item.id }}</strong>
                    <span class="dfb__status">{{ t(`devFeedback.status.${item.status}`) }}</span>
                    <p>{{ item.comment }}</p>
                    <p v-if="item.reply" class="dfb__reply">{{ item.reply }}</p>
                    <button type="button" class="dfb__link" @click="remove(item.id)">{{ t('devFeedback.delete') }}</button>
                </li>
            </ul>
        </dialog>
    </div>
</template>

<script setup lang="ts">
type Status = 'todo' | 'doing' | 'done'

interface Target {
    selector: string
    tag: string
    text: string
    classes: string
    testId: string | null
    components: string[]
    rect: { x: number; y: number; width: number; height: number }
}

interface Feedback {
    id: string
    status: Status
    comment: string
    category?: string
    route?: string
    reply?: string
}

type VueHost = Element & { __vueParentComponent?: VueInstance }
interface VueInstance {
    type?: { __file?: string }
    parent?: VueInstance | null
}

const ENDPOINT = '/api/__design-feedback'
const CATEGORIES = ['color', 'spacing', 'typography', 'alignment', 'text', 'icon', 'behavior', 'responsive', 'other']
const MAX_DEPTH = 7

const { t } = useI18n()
const router = useRouter()

const dialog = ref<HTMLDialogElement | null>(null)
const isPointing = ref(false)
const isSending = ref(false)
const hovered = ref<DOMRect | null>(null)
const target = ref<Target | null>(null)
const comment = ref('')
const category = ref('other')
const error = ref('')
const items = ref<Feedback[]>([])
const route = computed(() => router.currentRoute.value.fullPath)

const openCount = computed(() => items.value.filter(item => item.status !== 'done').length)
const sortedItems = computed(() => items.value.slice().reverse())
const hoverStyle = computed(() =>
    hovered.value
        ? { top: `${hovered.value.top}px`, left: `${hovered.value.left}px`, width: `${hovered.value.width}px`, height: `${hovered.value.height}px` }
        : {}
)

const isOwn = (el: Element | null): boolean => !!el?.closest('#dev-feedback-root')

const cssPath = (el: Element): string => {
    const parts: string[] = []
    let node: Element | null = el
    while (node && node !== document.body && parts.length < MAX_DEPTH) {
        if (node.id) {
            parts.unshift(`#${CSS.escape(node.id)}`)
            break
        }
        let part = node.tagName.toLowerCase()
        const testId = node.getAttribute('data-test-id')
        if (testId) {
            part += `[data-test-id="${testId}"]`
        }
        const parent: Element | null = node.parentElement
        const current: Element = node
        const sameTag = parent ? [...parent.children].filter(child => child.tagName === current.tagName) : []
        if (sameTag.length > 1) {
            part += `:nth-of-type(${sameTag.indexOf(current) + 1})`
        }
        parts.unshift(part)
        node = parent
    }
    return parts.join(' > ')
}

const componentFiles = (el: Element): string[] => {
    const files: string[] = []
    let instance = (el as VueHost).__vueParentComponent
    while (instance && files.length < 4) {
        const file = instance.type?.__file
        if (file && !file.includes('node_modules') && !files.includes(file)) {
            files.push(file.replace(/^.*?(functional|technical|app)\//, '$1/'))
        }
        instance = instance.parent ?? undefined
    }
    return files
}

const describe = (el: Element): Target => {
    const rect = el.getBoundingClientRect()
    return {
        selector: cssPath(el),
        tag: el.tagName.toLowerCase(),
        text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 160),
        classes: (el.getAttribute('class') ?? '').slice(0, 300),
        testId: el.getAttribute('data-test-id'),
        components: componentFiles(el),
        rect: { x: Math.round(rect.x), y: Math.round(rect.y + window.scrollY), width: Math.round(rect.width), height: Math.round(rect.height) },
    }
}

const load = async (): Promise<void> => {
    try {
        items.value = await $fetch<Feedback[]>(ENDPOINT)
    } catch {
        items.value = []
    }
}

const onMove = (event: MouseEvent): void => {
    const el = document.elementFromPoint(event.clientX, event.clientY)
    hovered.value = el && !isOwn(el) ? el.getBoundingClientRect() : null
}

const onPick = (event: MouseEvent): void => {
    const el = document.elementFromPoint(event.clientX, event.clientY)
    if (!el || isOwn(el)) {
        return
    }
    event.preventDefault()
    event.stopPropagation()
    target.value = describe(el)
    stopPointing()
    dialog.value?.showModal()
}

const stopPointing = (): void => {
    isPointing.value = false
    hovered.value = null
    document.removeEventListener('mousemove', onMove, true)
    document.removeEventListener('click', onPick, true)
}

const startPointing = (): void => {
    dialog.value?.close()
    isPointing.value = true
    document.addEventListener('mousemove', onMove, true)
    document.addEventListener('click', onPick, true)
}

const toggle = async (): Promise<void> => {
    if (isPointing.value) {
        stopPointing()
    }
    await load()
    dialog.value?.showModal()
}

const close = (): void => dialog.value?.close()

const send = async (): Promise<void> => {
    isSending.value = true
    error.value = ''
    try {
        await $fetch(ENDPOINT, {
            method: 'POST',
            body: { comment: comment.value, category: category.value, route: route.value, target: target.value },
        })
        comment.value = ''
        target.value = null
        await load()
    } catch {
        error.value = t('devFeedback.error')
    } finally {
        isSending.value = false
    }
}

const remove = async (id: string): Promise<void> => {
    await $fetch(`${ENDPOINT}?id=${id}`, { method: 'DELETE' })
    await load()
}

onMounted(load)
onBeforeUnmount(stopPointing)
</script>

<style scoped>
.dfb__fab {
    position: fixed;
    inset-inline-start: 12px;
    inset-block-end: 96px;
    z-index: 9000;
    min-width: var(--tap);
    height: var(--tap);
    border: var(--outline) solid var(--ink);
    border-radius: 999px;
    background: var(--yellow);
    color: var(--ink);
    box-shadow: var(--shadow);
    font: 700 16px var(--font-body);
    cursor: pointer;
}

.dfb__hint {
    position: fixed;
    inset-block-start: 12px;
    inset-inline: 12px;
    z-index: 9001;
    padding: 8px 12px;
    border: var(--outline) solid var(--ink);
    border-radius: 12px;
    background: var(--sky);
    color: var(--ink);
    text-align: center;
}

.dfb__outline {
    position: fixed;
    z-index: 9001;
    border: 3px solid var(--coral);
    pointer-events: none;
}

.dfb__dialog {
    width: min(92vw, 460px);
    max-height: 88vh;
    padding: 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 16px;
    background: var(--paper);
    color: var(--ink);
    font-family: var(--font-body);
}

.dfb__title,
.dfb__subtitle {
    margin: 0 0 8px;
}

.dfb__meta,
.dfb__target {
    margin: 0 0 8px;
    font-size: 13px;
    color: var(--ink-soft);
    word-break: break-all;
}

.dfb__label {
    display: block;
    margin: 12px 0 4px;
    font-weight: 700;
}

.dfb__field {
    width: 100%;
    padding: 8px;
    border: 2px solid var(--ink);
    border-radius: 8px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
}

.dfb__row {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 12px;
}

.dfb__btn {
    min-height: var(--tap);
    padding: 0 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 12px;
    background: var(--paper);
    color: var(--ink);
    font: 700 15px var(--font-body);
    cursor: pointer;
}

.dfb__btn--primary {
    background: var(--mint);
}

.dfb__btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.dfb__error {
    color: var(--coral);
}

.dfb__list {
    margin: 0;
    padding: 0;
    list-style: none;
}

.dfb__item {
    padding: 8px 0;
    border-top: 1px solid var(--ink-soft);
}

.dfb__item[data-status='done'] {
    opacity: 0.55;
}

.dfb__item p {
    margin: 4px 0;
}

.dfb__status {
    margin-inline-start: 8px;
    font-size: 12px;
}

.dfb__reply {
    padding: 6px 8px;
    border-radius: 8px;
    background: var(--mint-soft);
}

.dfb__link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink-soft);
    text-decoration: underline;
    cursor: pointer;
}
</style>
