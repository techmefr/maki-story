<template>
    <div ref="root" class="stack empty" :class="[`empty--${kind}`, { 'empty--paused': isOffscreen }]" data-testid="empty-state">
        <div class="empty__scene" aria-hidden="true">
            <AppMaki :size="size" class="empty__maki" />
            <AppIcon v-if="sceneIcon" :name="sceneIcon" :size="Math.round(size / 3)" class="empty__prop" />
        </div>
        <p class="empty__title">{{ title }}</p>
        <p v-if="shownHint" class="empty__hint">{{ shownHint }}</p>
        <slot />
    </div>
</template>

<script setup lang="ts">
type TEmptyKind = 'generic' | 'library' | 'notifications' | 'offline' | 'messages' | 'proposals' | 'treasure' | 'locked' | 'people'

const SCENE_ICONS: Record<TEmptyKind, IconName | null> = {
    generic: null,
    library: 'book',
    notifications: 'moon',
    offline: 'cloud-off',
    messages: 'message-heart',
    proposals: 'sparkles',
    treasure: 'heart',
    locked: 'lock',
    people: 'users',
}

const { size = 84, kind = 'generic', hint, hintChild } = defineProps<{ title: string; hint?: string; hintChild?: string; size?: number; kind?: TEmptyKind }>()

const { isChild } = useCurrentMember()
const root = ref<HTMLElement | null>(null)
const isOffscreen = ref(false)

const sceneIcon = computed(() => SCENE_ICONS[kind])
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
