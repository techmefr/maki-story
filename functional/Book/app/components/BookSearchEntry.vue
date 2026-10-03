<template>
    <div class="search-entry">
        <button type="button" class="search-entry__handle" :aria-label="t('search.open')" data-testid="book-search-open" @click="open">
            <AppIcon name="search" :size="22" />
            <span class="search-entry__text">{{ t('search.open') }}</span>
            <AppIcon name="chevron-left" :size="22" class="search-entry__arrow mirror-rtl" motion="nudge" />
        </button>
        <div v-if="isOpen" class="sheet-backdrop" @click.self="close">
            <div v-sheet="close" class="sheet stack" role="dialog" aria-modal="true" aria-labelledby="search-title" data-testid="book-search">
                <div class="row">
                    <h2 id="search-title" class="subtitle grow">{{ t('search.title') }}</h2>
                    <AppButton variant="secondary" size="sm" is-round :aria-label="t('common.close')" @click="close">
                        <AppIcon name="close" :size="22" />
                    </AppButton>
                </div>
                <div v-for="group in groups" :key="group.id" class="stack search-entry__group" role="group" :aria-label="t(`library.filters.${group.id}`)">
                    <h3 class="label">{{ t(`library.filters.${group.id}`) }}</h3>
                    <div class="row row--wrap">
                        <AppChip
                            v-for="item in group.items"
                            :key="item"
                            :data-filter="`${group.id}-${item}`"
                            @click="toggle(group.id, item)"
                         :selected="picked[group.id] === item">
                            {{ t(`library.filters.${group.plural}.${item}`) }}
                        </AppChip>
                    </div>
                </div>
                <AppButton is-block data-testid="book-search-go" @click="go"><AppIcon name="book" :size="22" />{{ t('search.go') }}</AppButton>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
type TGroupId = 'type' | 'mood' | 'theme'

const SWIPE_MIN_PX = 70
const SWIPE_RATIO = 1.6
const BOOK_TYPES = ['standard', 'comic', 'wordless', 'child-written']

const { t } = useI18n()
const { isChild } = useCurrentMember()
const isOpen = ref(false)
const picked = reactive<Record<TGroupId, string>>({ type: '', mood: '', theme: '' })

const groups: { id: TGroupId; plural: string; items: string[] }[] = [
    { id: 'type', plural: 'types', items: BOOK_TYPES },
    { id: 'mood', plural: 'moods', items: BOOK_MOODS },
    { id: 'theme', plural: 'themes', items: BOOK_THEMES },
]

const open = (): void => {
    isOpen.value = true
}

const close = (): void => {
    isOpen.value = false
}

const toggle = (id: TGroupId, item: string): void => {
    picked[id] = picked[id] === item ? '' : item
}

const go = async (): Promise<void> => {
    const query = Object.fromEntries(Object.entries(picked).filter(([, value]) => value !== ''))
    close()
    await navigateTo({ path: isChild.value ? '/kid/library' : '/library', query })
}

let startX = 0
let startY = 0

const onTouchStart = (event: TouchEvent): void => {
    startX = event.touches[0]?.clientX ?? 0
    startY = event.touches[0]?.clientY ?? 0
}

const onTouchEnd = (event: TouchEvent): void => {
    if (isOpen.value || document.querySelector('.sheet-backdrop, [role="dialog"]')) {
        return
    }
    const dx = (event.changedTouches[0]?.clientX ?? 0) - startX
    const dy = (event.changedTouches[0]?.clientY ?? 0) - startY
    const direction = document.documentElement.dir === 'rtl' ? 1 : -1
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * SWIPE_RATIO && Math.sign(dx) === direction) {
        open()
    }
}

onMounted(() => {
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
})

onBeforeUnmount(() => {
    document.removeEventListener('touchstart', onTouchStart)
    document.removeEventListener('touchend', onTouchEnd)
})
</script>

<style scoped>
.search-entry__handle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    width: 100%;
    min-height: var(--tap);
    padding: 10px 16px;
    border: 3px solid var(--ink);
    border-radius: 18px;
    background: var(--violet);
    color: var(--on-accent);
    box-shadow: var(--shadow);
    font: 700 1.0625rem/1.15 var(--font-title);
    cursor: pointer;
}

.search-entry__text {
    flex: 1;
    text-align: start;
    overflow-wrap: anywhere;
}
</style>
