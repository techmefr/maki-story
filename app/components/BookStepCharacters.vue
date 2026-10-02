<template>
    <div class="stack">
        <p class="muted">
            {{ t('bookDraft.characters.intro') }}
        </p>
        <div v-for="character in characters" :key="character.key" class="card stack" role="group" :aria-label="t('bookDraft.characters.groupLabel', { name: character.name })">
            <div class="row">
                <label class="stack grow" style="gap: 4px">
                    <span class="label">{{ t('bookDraft.characters.name') }}</span>
                    <input class="input" :value="character.name" @input="updateCharacter(character.key, { name: ($event.target as HTMLInputElement).value })" />
                </label>
                <AppButton variant="secondary" size="sm"
                    :disabled="isCharacterUsed(character.key)"
                    :aria-label="t('bookDraft.characters.remove', { name: character.name })"
                    @click="removeCharacter(character.key)">
                    ×
                </AppButton>
            </div>
            <div class="row row--wrap" role="group" :aria-label="t('bookDraft.characters.colors')">
                <button
                    v-for="color in VOICE_COLORS"
                    :key="color.id"
                    type="button"
                    class="swatch"
                    :class="{ 'swatch--on': character.color === color.id }"
                    :style="{ background: color.hex }"
                    :aria-pressed="character.color === color.id"
                    :aria-label="t('bookDraft.characters.colorLabel', { color: t(COLOR_KEYS[color.id]) })"
                    @click="updateCharacter(character.key, { color: color.id })"
                />
            </div>
            <label class="stack" style="gap: 4px">
                <span class="label">{{ t('bookDraft.characters.description') }}</span>
                <input
                    class="input"
                    :value="character.description"
                    :placeholder="t('bookDraft.characters.descriptionPlaceholder')"
                    @input="updateCharacter(character.key, { description: ($event.target as HTMLInputElement).value })"
                />
            </label>
            <button
                type="button"
                class="chip"
                :class="{ 'chip--on': character.isNarrator }"
                :aria-pressed="character.isNarrator"
                @click="setNarrator(character.key)"
            >
                {{ t('bookDraft.characters.narrator') }}
            </button>
            <div class="stack" style="gap: 6px">
                <span class="label">{{ t('bookDraft.characters.whoReads') }}</span>
                <MemberPicker :model-value="character.memberId" @update:model-value="updateCharacter(character.key, { memberId: $event })" />
            </div>
        </div>
        <form class="row" @submit.prevent="add">
            <label class="stack grow" style="gap: 4px">
                <span class="label">{{ t('bookDraft.characters.newCharacter') }}</span>
                <input v-model="newName" class="input" :placeholder="t('bookDraft.characters.newPlaceholder')" />
            </label>
            <AppButton variant="secondary" type="submit" :disabled="newName.trim() === ''">{{ t('bookDraft.characters.add') }}</AppButton>
        </form>
        <div class="muted" role="status">{{ castHint }}</div>
        <AppButton is-block @click="emit('next')">{{ t('common.next') }}</AppButton>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits<{ next: [] }>()

const COLOR_KEYS: Record<VoiceColorId, string> = {
    coral: 'bookDraft.characters.coral',
    sun: 'bookDraft.characters.sun',
    mint: 'bookDraft.characters.mint',
    sky: 'bookDraft.characters.sky',
    grape: 'bookDraft.characters.grape',
    pink: 'bookDraft.characters.pink',
}

const { t } = useI18n()
const { characters, addCharacter, updateCharacter, setNarrator, removeCharacter, isCharacterUsed } = useBookDraft()

const newName = ref('')

const castHint = computed(() => {
    const done = characters.value.filter(character => character.memberId !== null).length
    return t('bookDraft.characters.castHint', { done, total: characters.value.length })
})

const add = (): void => {
    addCharacter(newName.value)
    newName.value = ''
}
</script>
