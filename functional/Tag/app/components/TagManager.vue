<template>
    <div class="stack tags">
        <BackLink to="/library" />
        <div class="row">
            <h1 class="title grow">{{ t('tags.title') }}</h1>
            <span class="tags__count" :aria-label="t('tags.count', { count: tags.length })">{{ tags.length }}</span>
        </div>
        <p class="tags__intro">{{ t('tags.intro') }}</p>
        <div class="row row--wrap" role="group" :aria-label="t('tags.language')">
            <AppChip
                v-for="code in languages"
                :key="code"
                class="tags__lang"
                :selected="code === language"
                :lang="code"
                @click="language = code"
            >
                <FlagIcon :codes="[code]" :size="26" />
                {{ code.toUpperCase() }}
            </AppChip>
        </div>
        <AppButton v-if="isParent" is-block icon="plus" @click="openNew">{{ t('tags.new') }}</AppButton>
        <ul v-if="tags.length > 0" class="tags__list">
            <li v-for="tag in tags" :key="tag.slug">
                <AppListRow
                    :title="labelOf(tag, language)"
                    :subtitle="tag.slug"
                    :class="{ tags__row: isParent }"
                    :role="isParent ? 'button' : undefined"
                    :tabindex="isParent ? 0 : undefined"
                    :aria-label="isParent ? t('tags.edit', { name: labelOf(tag, language) }) : undefined"
                    @click="isParent && openEdit(tag)"
                    @keydown.enter.prevent="isParent && openEdit(tag)"
                    @keydown.space.prevent="isParent && openEdit(tag)"
                >
                    <template #lead><TagBubble :icon="tag.icon" :color="tag.color" /></template>
                    <template v-if="missingCount(tag) > 0" #action>
                        <AppBadge tone="warning">{{ t('tags.toTranslate', { count: missingCount(tag) }) }}</AppBadge>
                    </template>
                </AppListRow>
            </li>
        </ul>
        <AppEmpty v-else-if="isLoaded" kind="generic" :title="t('tags.empty')" :hint="t('tags.emptyHint')" />
        <TagEditorSheet :open="isEditing" :tag="edited" :languages="languages" @close="isEditing = false" @saved="isEditing = false" />
    </div>
</template>

<script setup lang="ts">
const { t, locale } = useI18n()
const { isParent } = useCurrentMember()
const { tags, languages, isLoaded, ensureLoaded, labelOf, missingCount } = useTags()

const language = ref(locale.value)
const edited = ref<ITag | null>(null)
const isEditing = ref(false)

const openNew = (): void => {
    edited.value = null
    isEditing.value = true
}

const openEdit = (tag: ITag): void => {
    edited.value = tag
    isEditing.value = true
}

onMounted(async () => {
    await ensureLoaded()
    if (!languages.value.includes(language.value)) {
        language.value = languages.value[0] ?? DEFAULT_LANGUAGE
    }
})
</script>

<style scoped>
.tags__count {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 12px;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--yellow);
    color: var(--on-accent);
    font: 700 1.0625rem/1 var(--font-title);
}

.tags__intro {
    margin: 0;
    color: var(--ink-soft);
    font: 500 1rem/1.4 var(--font-body);
}

.tags__lang {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 72px;
    justify-content: center;
}

.tags__lang.chip--on {
    background: var(--yellow);
    color: var(--on-accent);
    box-shadow: var(--shadow);
}

.tags__list {
    display: grid;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.tags__row {
    cursor: pointer;
}

.tags__row:active {
    transform: translate(2px, 3px);
    box-shadow: var(--shadow-press);
}

.tags__row:focus-visible {
    outline: 3px solid var(--ink);
    outline-offset: 3px;
}
</style>
