<template>
  <form class="stack composer" @submit.prevent="add">
    <div v-if="!isSimple" class="stack" style="gap: 8px">
      <span class="label">{{ t("studio.composer.whoSpeaks") }}</span>
      <div
        class="row row--wrap"
        role="group"
        :aria-label="t('studio.composer.character')"
      >
        <AppChip
          v-for="character in characters"
          :key="character.key"
          @click="selectedKey = character.key"
         :selected="selectedKey === character.key">
          {{ character.name }}
        </AppChip>
        <AppChip
          v-if="!isCreating"
          @click="isCreating = true"
        >
          {{ t("studio.composer.newCharacter") }}
        </AppChip>
      </div>
      <div v-if="isCreating" class="row">
        <input
          v-model="newName"
          class="input grow"
          :aria-label="t('studio.composer.newName')"
          :placeholder="t('studio.composer.newPlaceholder')"
          @keydown.enter.prevent="createCharacter"
        />
        <AppButton size="sm"
          :disabled="newName.trim() === ''"
          @click="createCharacter">
          {{ t("common.create") }}
        </AppButton>
      </div>
      <div
        v-if="selected && selected.memberId === null"
        class="stack"
        style="gap: 6px"
      >
        <span class="label">{{
          t("studio.composer.whoReads", { name: selected.name })
        }}</span>
        <MemberPicker
          :model-value="selected.memberId"
          @update:model-value="
            updateCharacter(selected.key, { memberId: $event })
          "
        />
      </div>
    </div>
    <div v-if="panels.length > 0" class="stack" style="gap: 8px">
      <span class="label">{{ t("studio.composer.whichPanel") }}</span>
      <div
        class="row row--wrap"
        role="group"
        :aria-label="t('studio.composer.panelGroup')"
      >
        <AppChip
          v-for="(_panel, index) in panels"
          :key="index"
          @click="panelIndex = index"
         :selected="panelIndex === index">
          {{ t("studio.composer.panel", { index: index + 1 }) }}
        </AppChip>
      </div>
    </div>
    <label class="stack" style="gap: 6px">
      <span class="label">{{ t("studio.composer.text") }}</span>
      <textarea
        v-model="text"
        class="input"
        :placeholder="
          isSimple
            ? t('studio.composer.textSimple')
            : t('studio.composer.textCharacter')
        "
        @keydown.ctrl.enter.prevent="add"
        @keydown.meta.enter.prevent="add"
      />
    </label>
    <ToneChips v-model="tone" />
    <label class="stack" style="gap: 6px">
      <span class="label">{{ t("studio.composer.sceneLabel") }}</span>
      <input
        v-model="sceneDescription"
        class="input"
        :placeholder="t('studio.composer.scenePlaceholder')"
      />
    </label>
    <div v-if="parsedCount > 1" class="muted" role="status">
      {{ t("studio.composer.willAdd", { count: parsedCount }) }}
    </div>
    <AppButton type="submit" :disabled="parsedCount === 0">
      {{ t("common.add") }}
    </AppButton>
  </form>
</template>

<script setup lang="ts">
const props = defineProps<{ pageIndex: number; panels: IDraftPanel[] }>();

const { t } = useI18n();

const {
  characters,
  narrator,
  isSimple,
  addCharacter,
  updateCharacter,
  addLines,
} = useBookDraft();

const selectedKey = ref<number | null>(narrator.value?.key ?? null);
const panelIndex = ref<number | null>(props.panels.length > 0 ? 0 : null);
const text = ref("");
const tone = ref("");
const sceneDescription = ref("");
const isCreating = ref(false);
const newName = ref("");

const selected = computed(
  () =>
    characters.value.find((character) => character.key === selectedKey.value) ??
    null,
);

const parseLine = (
  raw: string,
): { characterKey: number | null; text: string } => {
  const match = /^([^:]{1,40}?)\s*:\s*(.+)$/.exec(raw);
  const named = match
    ? characters.value.find(
        (character) =>
          character.name.toLowerCase() === match[1]!.trim().toLowerCase(),
      )
    : undefined;
  if (isSimple.value || !named) {
    return { characterKey: selectedKey.value, text: raw };
  }
  return { characterKey: named.key, text: match![2]! };
};

const parsed = computed(() =>
  text.value
    .split("\n")
    .map((raw) => raw.trim())
    .filter((raw) => raw !== "")
    .map(parseLine),
);
const parsedCount = computed(() => parsed.value.length);

watch(
  () => props.panels.length,
  (count) => {
    if (count === 0) {
      panelIndex.value = null;
    } else if (panelIndex.value === null || panelIndex.value >= count) {
      panelIndex.value = count - 1;
    }
  },
);

const createCharacter = (): void => {
  if (newName.value.trim() === "") {
    return;
  }
  selectedKey.value = addCharacter(newName.value).key;
  newName.value = "";
  isCreating.value = false;
};

const add = (): void => {
  if (parsedCount.value === 0) {
    return;
  }
  parsed.value.forEach((item) => {
    addLines({
      pageIndex: props.pageIndex,
      panelIndex: panelIndex.value,
      characterKey: item.characterKey,
      texts: [item.text],
      tone: tone.value,
      sceneDescription: sceneDescription.value,
    });
  });
  text.value = "";
  sceneDescription.value = "";
  tone.value = "";
};
</script>

<style scoped>
.composer {
  border-top: 2px dashed var(--ink);
  padding-top: 12px;
}
</style>
