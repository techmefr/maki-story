<template>
    <div class="card stack voice" role="group" :aria-label="t('bookCreate.flow.voiceGroup', { n: number })" :data-testid="`voice-${number}`">
        <div v-if="!isSimple" class="stack">
            <span class="label">{{ t('bookCreate.flow.voiceName') }}</span>
            <div class="row row--wrap" role="group" :aria-label="t('studio.composer.character')">
                <AppChip v-for="character in characters" :key="character.key" :selected="line.characterKey === character.key" @click="selectCharacter(character.key)">
                    {{ character.name }}
                </AppChip>
                <AppChip v-if="!isCreating" data-testid="voice-new" @click="isCreating = true">{{ t('bookCreate.flow.newVoice') }}</AppChip>
            </div>
            <div v-if="isCreating" class="stack">
                <div class="row">
                    <input v-model="newName" class="input grow" :aria-label="t('studio.composer.newName')" :placeholder="t('studio.composer.newPlaceholder')" data-testid="voice-new-name" @keydown.enter.prevent="createCharacter" />
                    <AppButton :disabled="newName.trim() === ''" data-testid="voice-create" @click="createCharacter">{{ t('common.create') }}</AppButton>
                </div>
                <div class="row row--wrap" role="group" :aria-label="t('bookDraft.characters.colors')">
                    <button
                        v-for="color in VOICE_COLORS"
                        :key="color.id"
                        type="button"
                        class="swatch"
                        :class="{ 'swatch--on': newColor === color.id }"
                        :style="{ background: color.hex }"
                        :aria-pressed="newColor === color.id"
                        :aria-label="t('bookDraft.characters.colorLabel', { color: t(COLOR_KEYS[color.id]) })"
                        @click="newColor = color.id"
                    />
                </div>
            </div>
        </div>
        <div v-if="panels > 0" class="stack" role="group" :aria-label="t('studio.composer.panelGroup')">
            <span class="label">{{ t('studio.composer.whichPanel') }}</span>
            <div class="row row--wrap">
                <AppChip v-for="index in panels" :key="index" :selected="line.panelIndex === index - 1" @click="updateLine(line.key, { panelIndex: index - 1 })">
                    {{ t('studio.composer.panel', { index }) }}
                </AppChip>
            </div>
        </div>
        <div class="stack" role="group" :aria-label="t('bookCreate.flow.voiceLanguage')">
            <span class="label">{{ t('bookCreate.flow.voiceLanguage') }}</span>
            <div class="row row--wrap">
                <AppChip v-for="code in languageCodes" :key="code" :selected="currentLanguage === code" :data-testid="`voice-language-${code}`" @click="chooseLanguage(code)">
                    <FlagIcon :codes="[code]" :size="22" aria-hidden="true" />
                    {{ labelOf(code) }}
                </AppChip>
            </div>
            <p v-if="isTranslation" class="muted" role="note" data-testid="voice-translation-note">{{ t('bookCreate.flow.translationNote', { language: labelOf(currentLanguage) }) }}</p>
        </div>
        <label class="stack voice__field">
            <span class="label">{{ t('studio.composer.text') }}</span>
            <textarea :value="line.text" class="input" rows="3" :aria-label="t('studio.composer.text')" @input="updateLine(line.key, { text: ($event.target as HTMLTextAreaElement).value })" />
        </label>
        <label class="stack voice__field">
            <span class="label">{{ t('bookCreate.flow.noteLabel') }} <span class="muted">{{ t('bookCreate.flow.optional') }}</span></span>
            <input :value="line.tone" class="input" :placeholder="t('bookCreate.flow.notePlaceholder')" @input="updateLine(line.key, { tone: ($event.target as HTMLInputElement).value })" />
        </label>
        <div v-if="!isSimple && owner && !isTranslation" class="stack" role="group" :aria-label="t('bookCreate.flow.whoReads')">
            <span class="label">{{ t('bookCreate.flow.whoReads') }}</span>
            <div class="row row--wrap">
                <AppChip v-for="option in options" :key="option.id" :selected="owner.assignment === option.id" :data-testid="`reader-${option.id}`" @click="chooseAssignment(option.id)">
                    {{ t(option.label) }}
                </AppChip>
            </div>
            <MemberPicker v-if="owner.assignment === 'relative'" :language="language" :model-value="owner.memberId" @update:model-value="chooseMember" />
            <p v-if="owner.assignment === 'relative'" class="muted">{{ t('bookCreate.flow.relativeHint', { language: languageName }) }}</p>
        </div>
        <AppButton variant="secondary" size="sm" icon="close" :aria-label="t('bookCreate.flow.removeVoice', { n: number })" @click="removeLine(line.key)">
            {{ t('bookCreate.flow.removeVoiceShort') }}
        </AppButton>
    </div>
</template>

<script setup lang="ts">
const { line, number, panels = 0 } = defineProps<{ line: IDraftLine; number: number; panels?: number }>()

const COLOR_KEYS: Record<VoiceColorId, string> = {
    coral: 'bookDraft.characters.coral',
    sun: 'bookDraft.characters.sun',
    mint: 'bookDraft.characters.mint',
    sky: 'bookDraft.characters.sky',
    grape: 'bookDraft.characters.grape',
    pink: 'bookDraft.characters.pink',
}

const { t } = useI18n()
const isAiCreationEnabled = useAiCreationEnabled()
const { characters, isSimple, language, isTranslationLine, updateLine, removeLine, addCharacter, setCharacterReader, effectiveCharacterKey, characterByKey } = useBookDraft()
const { current } = useCurrentMember()
const { members } = useMembers()

const isCreating = ref(false)
const newName = ref('')
const newColor = ref<VoiceColorId | null>(null)

const currentLanguage = computed(() => (line.language === '' ? language.value : line.language))
const isTranslation = computed(() => isTranslationLine(line))
const languageCodes = computed(() => [...new Set([language.value, ...members.value.flatMap(member => member.spokenLanguages)])])
const labelOf = (code: string): string => LANGUAGES.find(item => item.code === code)?.label ?? code

const chooseLanguage = (code: string): void => {
    updateLine(line.key, { language: code === language.value ? '' : code })
}

const owner = computed(() => characterByKey(effectiveCharacterKey(line)))
const languageName = computed(() => labelOf(language.value))
const options = computed(() => {
    const base = [
        { id: 'relative' as const, label: 'bookCreate.flow.relative' },
        { id: 'open' as const, label: 'bookCreate.flow.open' },
        { id: 'later' as const, label: 'bookCreate.flow.later' },
    ]
    return isAiCreationEnabled ? [base[0]!, { id: 'ai' as const, label: 'bookCreate.flow.ai' }, base[1]!, base[2]!] : base
})

const selectCharacter = (key: number): void => {
    updateLine(line.key, { characterKey: key })
}

const createCharacter = (): void => {
    if (newName.value.trim() === '') {
        return
    }
    const member = current.value && current.value.role !== 'child' ? current.value.id : null
    const created = addCharacter(newName.value, member, newColor.value)
    updateLine(line.key, { characterKey: created.key })
    newName.value = ''
    newColor.value = null
    isCreating.value = false
}

const chooseAssignment = (assignment: CharacterAssignment): void => {
    if (!owner.value) {
        return
    }
    const fallback = assignment === 'relative' ? (owner.value.memberId ?? (current.value && current.value.role !== 'child' ? current.value.id : null)) : null
    setCharacterReader(owner.value.key, assignment, fallback)
}

const chooseMember = (memberId: string): void => {
    if (owner.value) {
        setCharacterReader(owner.value.key, 'relative', memberId)
    }
}
</script>

<style scoped>
.voice__field {
    gap: 6px;
}
</style>
