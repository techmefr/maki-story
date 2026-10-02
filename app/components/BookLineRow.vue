<template>
  <div class="stack line" style="gap: 6px">
    <div class="row">
      <div class="grow">
        <div v-if="!isSimple" class="label">
          <span class="dot" :style="{ background: hex }" />
          {{ character?.name ?? t("studio.narrator") }}
        </div>
        <div>{{ line.text }}</div>
        <div v-if="line.sceneDescription" class="muted">
          {{ t("studio.sceneLine", { text: line.sceneDescription }) }}
        </div>
      </div>
      <button
        type="button"
        class="chip"
        :aria-expanded="isEditing"
        @click="isEditing = !isEditing"
      >
        {{
          line.tone === ""
            ? t("studio.lineRow.tone")
            : t("studio.lineRow.toneWith", { tone: line.tone })
        }}
      </button>
      <AppButton variant="secondary" size="sm"
        :aria-label="t('studio.lineRow.remove')"
        @click="removeLine(line.key)">
        ×
      </AppButton>
    </div>
    <AiTranslationSuggest v-if="isAiCreationEnabled && isParent && !isWordless" :line="line" />
    <ToneChips
      v-if="isEditing"
      :model-value="line.tone"
      @update:model-value="updateLine(line.key, { tone: $event })"
    />
  </div>
</template>

<script setup lang="ts">
const isAiCreationEnabled = useAiCreationEnabled()
const props = defineProps<{ line: IDraftLine }>();

const { t } = useI18n();

const { isParent } = useCurrentMember();
const {
  isSimple,
  isWordless,
  characterByKey,
  effectiveCharacterKey,
  updateLine,
  removeLine,
} = useBookDraft();

const isEditing = ref(false);

const character = computed(() =>
  characterByKey(effectiveCharacterKey(props.line)),
);
const hex = computed(
  () =>
    VOICE_COLORS.find((color) => color.id === character.value?.color)?.hex ??
    "#fff",
);
</script>

<style scoped>
.dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border: 2px solid var(--ink);
  border-radius: 50%;
  margin-inline-end: 6px;
}
</style>
