<template>
  <div class="stack" style="gap: 8px">
    <span class="label">{{ t("studio.tones.optional") }}</span>
    <div
      class="row row--wrap"
      role="group"
      :aria-label="t('studio.tones.group')"
    >
      <button
        v-for="option in TONES"
        :key="option.id"
        type="button"
        class="chip"
        :class="{ 'chip--on': modelValue === toneLabel(option.id) }"
        :aria-pressed="modelValue === toneLabel(option.id)"
        @click="toggle(toneLabel(option.id))"
      >
        {{ toneLabel(option.id) }}
      </button>
      <button
        type="button"
        class="chip"
        :class="{ 'chip--on': isOther }"
        :aria-pressed="isOther"
        @click="isFree = !isFree"
      >
        {{ t("studio.tones.other") }}
      </button>
    </div>
    <input
      v-if="isOther"
      class="input"
      :aria-label="t('studio.tones.free')"
      :placeholder="t('studio.tones.freePlaceholder')"
      :value="modelValue"
      @input="
        emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ modelValue: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();

const { t } = useI18n();

const isFree = ref(false);

const toneLabel = (id: string): string => t(`studio.tones.${id}`);

const isPreset = computed(() =>
  TONES.some((option) => toneLabel(option.id) === props.modelValue),
);
const isOther = computed(
  () => isFree.value || (props.modelValue !== "" && !isPreset.value),
);

const toggle = (label: string): void => {
  isFree.value = false;
  emit("update:modelValue", props.modelValue === label ? "" : label);
};
</script>
