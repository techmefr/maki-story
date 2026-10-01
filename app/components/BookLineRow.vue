<template>
    <div class="stack line" style="gap: 6px">
        <div class="row">
            <div class="grow">
                <div v-if="!isSimple" class="label">
                    <span class="dot" :style="{ background: hex }" />
                    {{ character?.name ?? NARRATOR_NAME }}
                </div>
                <div>{{ line.text }}</div>
                <div v-if="line.sceneDescription" class="muted">Scène : {{ line.sceneDescription }}</div>
            </div>
            <button type="button" class="chip" :aria-expanded="isEditing" @click="isEditing = !isEditing">
                {{ line.tone === '' ? 'Ton' : `Ton : ${line.tone}` }}
            </button>
            <button type="button" class="btn btn--small btn--white" aria-label="Retirer la réplique" @click="removeLine(line.key)">×</button>
        </div>
        <ToneChips v-if="isEditing" :model-value="line.tone" @update:model-value="updateLine(line.key, { tone: $event })" />
    </div>
</template>

<script setup lang="ts">
const props = defineProps<{ line: IDraftLine }>()

const { isSimple, characterByKey, effectiveCharacterKey, updateLine, removeLine } = useBookDraft()

const isEditing = ref(false)

const character = computed(() => characterByKey(effectiveCharacterKey(props.line)))
const hex = computed(() => VOICE_COLORS.find(color => color.id === character.value?.color)?.hex ?? '#fff')
</script>

<style scoped>
.dot {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid var(--ink);
    border-radius: 50%;
    margin-right: 6px;
}
</style>
