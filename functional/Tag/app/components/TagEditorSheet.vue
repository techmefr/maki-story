<template>
    <AppBottomSheet :open="open" :title="sheetTitle" @close="emit('close')">
        <div class="editor__head">
            <TagBubble :icon="icon" :color="color" :size="56" />
            <p class="editor__slug">{{ t('tags.editor.slug', { slug: slugPreview || '…' }) }}</p>
            <AppIconButton icon="close" :label="t('common.close')" @click="emit('close')" />
        </div>
        <section class="stack" aria-labelledby="tag-names">
            <h3 id="tag-names" class="editor__heading">{{ t('tags.editor.names') }}</h3>
            <div v-for="language in languages" :key="language" class="editor__field">
                <FlagIcon :codes="[language]" :size="38" />
                <AppInput
                    :model-value="names[language] ?? ''"
                    :lang="language"
                    :placeholder="t('tags.editor.placeholder')"
                    :aria-label="t('tags.editor.nameIn', { language: languageName(language) })"
                    maxlength="40"
                    @update:model-value="setName(language, $event)"
                />
            </div>
        </section>
        <section class="stack" aria-labelledby="tag-icons">
            <h3 id="tag-icons" class="editor__heading">{{ t('tags.editor.icon') }}</h3>
            <div class="editor__icons">
                <button
                    v-for="item in TAG_ICON_IDS"
                    :key="item"
                    type="button"
                    class="editor__icon"
                    :class="{ 'editor__icon--on': item === icon }"
                    :style="item === icon ? { background: hex } : undefined"
                    :aria-pressed="item === icon ? 'true' : 'false'"
                    :aria-label="t(`tags.icons.${item}`)"
                    @click="icon = item"
                >
                    <TagIcon :icon="item" :size="28" />
                </button>
            </div>
        </section>
        <section class="stack" aria-labelledby="tag-colors">
            <h3 id="tag-colors" class="editor__heading">{{ t('tags.editor.color') }}</h3>
            <div class="row row--wrap">
                <button
                    v-for="item in TAG_COLOR_IDS"
                    :key="item"
                    type="button"
                    class="editor__color"
                    :class="{ 'editor__color--on': item === color }"
                    :style="{ background: getVoiceColor(item).hex }"
                    :aria-pressed="item === color ? 'true' : 'false'"
                    :aria-label="t(`tags.colors.${item}`)"
                    @click="color = item"
                />
            </div>
        </section>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
        <div v-if="isConfirmingDelete" class="editor__confirm stack" role="alertdialog" :aria-label="t('tags.editor.confirmTitle')">
            <p class="editor__confirm-text">{{ t('tags.editor.confirmText', { count: tag?.bookCount ?? 0 }) }}</p>
            <div class="row row--wrap">
                <AppButton variant="secondary" icon="close" @click="isConfirmingDelete = false">{{ t('common.cancel') }}</AppButton>
                <AppButton variant="destructive" icon="trash" :loading="isBusy" @click="remove">{{ t('tags.editor.confirmDelete') }}</AppButton>
            </div>
        </div>
        <div v-else class="row editor__actions">
            <AppButton v-if="tag" variant="secondary" icon="trash" class="editor__delete" @click="isConfirmingDelete = true">{{ t('tags.editor.delete') }}</AppButton>
            <AppButton icon="check" class="editor__save grow" :disabled="!canSave" :loading="isBusy" @click="save">{{ t('tags.editor.save') }}</AppButton>
        </div>
    </AppBottomSheet>
</template>

<script setup lang="ts">
const { open, tag, languages } = defineProps<{ open: boolean; tag: ITag | null; languages: string[] }>()
const emit = defineEmits<{ close: []; saved: [] }>()

const { t } = useI18n()
const { tags, create, update, remove: removeTag } = useTags()
const { labelOf } = useTagLabel()

const names = ref<Record<string, string>>({})
const color = ref<VoiceColorId>('sun')
const icon = ref<TagIconId>('book')
const isBusy = ref(false)
const isConfirmingDelete = ref(false)
const errorMessage = ref('')

const hex = computed(() => getVoiceColor(color.value).hex)
const input = computed<ITagInput>(() => ({ names: names.value, color: color.value, icon: icon.value }))
const slugPreview = computed(() => (tag ? tag.slug : slugForNames(names.value)))
const problem = computed(() =>
    checkTagInput(
        input.value,
        tags.value.map(item => item.slug),
        tag?.slug ?? null,
    ),
)
const canSave = computed(() => problem.value === null)
const sheetTitle = computed(() => (tag ? labelOf(tag) : t('tags.editor.newTitle')))

const languageName = (code: string): string => LANGUAGES.find(item => item.code === code)?.label ?? code

const setName = (language: string, value: string): void => {
    names.value = { ...names.value, [language]: value }
    errorMessage.value = ''
}

const reset = (): void => {
    names.value = { ...(tag?.names ?? {}) }
    color.value = tag?.color ?? 'sun'
    icon.value = tag?.icon ?? 'book'
    isConfirmingDelete.value = false
    errorMessage.value = ''
}

const problemMessage = (error: unknown): string => {
    const code = serverMessageOf(error)
    const known: TagProblem[] = ['name-required', 'slug-empty', 'slug-taken', 'color-invalid', 'icon-invalid', 'language-invalid', 'name-too-long']
    return known.includes(code as TagProblem) ? t(`tags.errors.${code}`) : apiErrorMessage(error, t('tags.errors.save'))
}

const run = async (action: () => Promise<void>): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        await action()
        emit('saved')
    } catch (error) {
        errorMessage.value = problemMessage(error)
    } finally {
        isBusy.value = false
    }
}

const save = (): Promise<void> => run(() => (tag ? update(tag.slug, input.value) : create(input.value)))

const remove = (): Promise<void> => run(() => removeTag(tag?.slug ?? ''))

watch(() => open, isOpen => isOpen && reset(), { immediate: true })
</script>

<style scoped>
.editor__head {
    display: flex;
    align-items: center;
    gap: 14px;
}

.editor__slug {
    flex: 1;
    min-width: 0;
    margin: 0;
    color: var(--ink-soft);
    font: 600 0.9375rem/1.2 var(--font-body);
    overflow-wrap: anywhere;
}

.editor__heading {
    margin: 0;
    font: 700 1.125rem/1.2 var(--font-title);
}

.editor__field {
    display: flex;
    align-items: center;
    gap: 10px;
}

.editor__field :deep(.input) {
    flex: 1;
    border-radius: 999px;
    border-width: var(--outline);
}

.editor__icons {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 10px;
}

.editor__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: var(--tap);
    aspect-ratio: 1;
    padding: 0;
    border: var(--outline) solid var(--ink);
    border-radius: 16px;
    background: var(--paper);
    color: var(--on-accent);
    cursor: pointer;
}

.editor__icon:not(.editor__icon--on) {
    color: var(--ink);
}

.editor__icon--on {
    box-shadow: var(--shadow);
}

.editor__color {
    width: 48px;
    height: 48px;
    padding: 0;
    border: var(--outline) solid var(--ink);
    border-radius: 50%;
    cursor: pointer;
}

.editor__color--on {
    box-shadow:
        0 0 0 3px var(--bg),
        0 0 0 6px var(--ink);
}

.editor__actions {
    gap: 12px;
}

.editor__delete {
    --tone: var(--danger-soft);
    flex: none;
}

.editor__save {
    box-shadow: var(--shadow-lg);
}

.editor__confirm {
    padding: 14px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--danger-soft);
    color: var(--on-accent);
}

.editor__confirm-text {
    margin: 0;
    font: 700 1rem/1.3 var(--font-body);
}
</style>
