<template>
    <section class="pageview stack" :aria-label="t('pageView.title', { n: pageNumber })" :data-mode="mode" data-testid="page-view">
        <header v-if="showNav" class="row row--wrap pageview__head">
            <AppButton variant="secondary" size="sm" class="pageview__nav" :disabled="pageNumber <= 1" :aria-label="t('pageView.previous')" @click="emit('go', -1)">
                <AppIcon name="back" :size="20" class="mirror-rtl" />
            </AppButton>
            <h3 class="subtitle grow pageview__title">{{ t('pageView.title', { n: pageNumber }) }} / {{ pageCount }}</h3>
            <AppButton variant="secondary" size="sm" class="pageview__nav" :disabled="pageNumber >= pageCount" :aria-label="t('pageView.next')" @click="emit('go', 1)">
                <AppIcon name="next" :size="20" class="mirror-rtl" />
            </AppButton>
        </header>
        <PageScanViewer v-if="canSeeScan && view.fileId" :file-id="view.fileId" :panel-count="view.panelCount" :alt="t('pageView.scan.alt', { n: pageNumber })" />
        <img v-else-if="canSeeScan && view.previewUrl" :src="view.previewUrl" :alt="t('pageView.scan.alt', { n: pageNumber })" class="pageview__preview" />
        <p v-else-if="canSeeScan" class="muted" data-testid="no-scan">{{ t('pageView.noScan') }}</p>
        <div class="stack pageview__description">
            <button type="button" class="chip pageview__toggle" :aria-expanded="isDescriptionOpen" aria-controls="pageview-description" data-testid="description-toggle" @click="isDescriptionOpen = !isDescriptionOpen">
                <AppIcon name="chevron-down" :size="18" :class="{ 'pageview__chevron--open': isDescriptionOpen }" />
                {{ t('pageView.description') }}
            </button>
            <div v-show="isDescriptionOpen" id="pageview-description">
                <textarea
                    v-if="isEditable"
                    class="input"
                    rows="2"
                    :value="view.description"
                    :aria-label="t('pageView.description')"
                    @input="emit('update-description', ($event.target as HTMLTextAreaElement).value)"
                />
                <p v-else class="pageview__text">{{ view.description || t('pageView.noDescription') }}</p>
            </div>
        </div>
        <div class="row row--wrap">
            <span class="badge" data-testid="character-count">{{ t('pageView.characters', { count: view.characters.length }) }}</span>
            <button v-if="mode === 'record'" type="button" class="chip pageview__chip" :class="{ 'chip--on': isOnlyMine }" :aria-pressed="isOnlyMine" data-testid="only-mine" @click="isOnlyMine = !isOnlyMine">
                <AppIcon name="mic" :size="18" />{{ t('pageView.onlyMine') }}
            </button>
            <button v-if="mode !== 'create'" type="button" class="chip pageview__chip" :class="{ 'chip--on': isLarge }" :aria-pressed="isLarge" @click="isLarge = !isLarge">
                <AppIcon name="eye" :size="18" />{{ t('pageView.largeText') }}
            </button>
            <slot name="toolbar" />
        </div>
        <p v-if="view.characters.length === 0" class="muted">{{ t('pageView.noLines') }}</p>
        <article
            v-for="character in view.characters"
            :key="character.id || 'orphan'"
            class="card stack pageview__character"
            :data-narrator="character.isNarrator"
            :aria-label="characterName(character)"
        >
            <div class="row row--wrap">
                <span v-if="character.color" class="dot" :style="{ background: hexOf(character.color) }" aria-hidden="true" />
                <span v-else class="badge pageview__narrator" data-testid="narrator-badge">{{ t('pageView.narrator') }}</span>
                <strong class="pageview__name">{{ characterName(character) }}</strong>
                <span v-if="reader(character)" class="row pageview__reader" data-testid="character-reader">
                    <AppAvatar :member="reader(character)" :size="28" />
                    <span>{{ reader(character)!.name }}</span>
                    <span class="badge">{{ languageLabel(language) }}</span>
                </span>
                <span v-else class="muted">{{ t('pageView.noReader') }}</span>
            </div>
            <input
                v-if="isEditable"
                class="input"
                :value="character.description"
                :placeholder="t('bookDraft.characters.descriptionPlaceholder')"
                :aria-label="t('bookDraft.characters.description')"
                @input="emit('update-character', character.id, ($event.target as HTMLInputElement).value)"
            />
            <p v-else-if="character.description" class="muted pageview__text">{{ character.description }}</p>
            <ol v-if="showLines" class="pageview__lines">
                <li
                    v-for="line in visibleLines(character)"
                    :key="line.id"
                    class="pageview__line stack"
                    :class="{ 'pageview__line--mine': isMine(line), 'pageview__line--dim': isDimmed(line), 'pageview__line--active': line.id === activeLineId, 'pageview__line--large': isLarge }"
                    :data-line-id="line.id"
                    :data-mine="isMine(line)"
                >
                    <p class="pageview__text" data-testid="page-line-text">{{ line.text }}</p>
                    <details v-if="line.originalText !== null" class="pageview__original">
                        <summary>{{ t('pageView.original') }}</summary>
                        <p class="pageview__text">{{ line.originalText }}</p>
                    </details>
                    <span v-if="line.tone" class="badge pageview__tone">{{ t('pageView.tone', { tone: line.tone }) }}</span>
                    <slot name="line-actions" :line="line" :character="character" :is-mine="isMine(line)" />
                </li>
            </ol>
        </article>
    </section>
</template>

<script setup lang="ts">
const props = withDefaults(
    defineProps<{
        view: IPageView
        mode: PageViewMode
        pageNumber: number
        pageCount: number
        language: string
        canSeeScan?: boolean
        myMemberId?: string | null
        activeLineId?: string | null
        showLines?: boolean
        showNav?: boolean
    }>(),
    { canSeeScan: true, myMemberId: null, activeLineId: null, showLines: true, showNav: true },
)

const emit = defineEmits<{
    go: [step: number]
    'update-description': [value: string]
    'update-character': [characterId: string, value: string]
}>()

const { t } = useI18n()
const { getById } = useMembers()

const isDescriptionOpen = ref(props.mode === 'create')
const isOnlyMine = ref(false)
const isLarge = ref(false)

const isEditable = computed(() => props.mode === 'create')

const hexOf = (color: string): string => getVoiceColor(color as VoiceColorId).hex
const reader = (character: IPageViewCharacter): IMember | null => getById(character.readerId)
const characterName = (character: IPageViewCharacter): string => (character.isNarrator && character.name === '' ? t('pageView.narrator') : character.name)
const isMine = (line: IPageViewLine): boolean => props.mode === 'record' && props.myMemberId !== null && line.memberId === props.myMemberId
const isDimmed = (line: IPageViewLine): boolean => props.mode === 'record' && props.myMemberId !== null && !isMine(line)
const visibleLines = (character: IPageViewCharacter): IPageViewLine[] => {
    return isOnlyMine.value && props.mode === 'record' ? character.lines.filter(isMine) : character.lines
}
</script>

<style scoped>
.pageview__head {
    flex-wrap: nowrap;
}

.pageview__title {
    margin: 0;
    text-align: center;
}

.pageview__nav,
.pageview__toggle,
.pageview__chip {
    min-width: 48px;
    min-height: 48px;
}

.pageview__preview {
    max-width: 100%;
    max-height: 40vh;
    border: 2.5px solid var(--ink);
    border-radius: 16px;
    object-fit: contain;
}

.pageview__chevron--open {
    transform: rotate(180deg);
}

.pageview__text {
    margin: 0;
    overflow-wrap: anywhere;
}

.pageview__name {
    overflow-wrap: anywhere;
}

.pageview__lines {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
}

.pageview__line {
    gap: 4px;
    border-inline-start: 4px solid transparent;
    padding-inline-start: 8px;
}

.pageview__line--mine {
    border-inline-start-color: var(--ink);
    background: var(--bg);
    font-weight: 800;
}

.pageview__line--dim {
    opacity: 0.55;
}

.pageview__line--active {
    border-inline-start-color: var(--coral);
}

.pageview__line--large .pageview__text {
    font-size: 1.5rem;
    line-height: 1.4;
}

@media (prefers-reduced-motion: no-preference) {
    .pageview__chevron--open {
        transition: transform 0.2s ease;
    }
}
</style>
