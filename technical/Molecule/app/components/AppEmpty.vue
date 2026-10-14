<template>
    <div ref="root" class="stack empty" :class="[`empty--${kind}`, { 'empty--paused': isOffscreen }]" data-testid="empty-state">
        <div class="empty__scene" aria-hidden="true">
            <MakiScene :pose="pose" :size="Math.max(size * 2, 160)" />
        </div>
        <p class="empty__title">{{ title }}</p>
        <p v-if="shownHint" class="empty__hint">{{ shownHint }}</p>
        <slot />
    </div>
</template>

<script setup lang="ts">
type TEmptyKind = 'generic' | 'library' | 'notifications' | 'offline' | 'messages' | 'proposals' | 'treasure' | 'locked' | 'people'

const POSES: Record<TEmptyKind, MakiPose> = {
    generic: 'thinking',
    library: 'shelf',
    notifications: 'drowsy',
    offline: 'unplugged',
    messages: 'mailbox',
    proposals: 'idea',
    treasure: 'heartBook',
    locked: 'padlock',
    people: 'hello',
}

const { size = 84, kind = 'generic', hint, hintChild } = defineProps<{ title: string; hint?: string; hintChild?: string; size?: number; kind?: TEmptyKind }>()

const { isChild } = useCurrentMember()
const root = ref<HTMLElement | null>(null)
const isOffscreen = ref(false)

const pose = computed(() => POSES[kind])
const shownHint = computed(() => (isChild.value && hintChild ? hintChild : hint))

let observer: IntersectionObserver | null = null

onMounted(() => {
    if (!root.value || typeof IntersectionObserver === 'undefined') {
        return
    }
    observer = new IntersectionObserver(entries => {
        isOffscreen.value = !(entries[0]?.isIntersecting ?? true)
    })
    observer.observe(root.value)
})

onBeforeUnmount(() => observer?.disconnect())
</script>
