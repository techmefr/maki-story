<template>
  <div class="shapes stack">
    <div class="shapes__slots" aria-hidden="true">
      <span v-for="slot in SHAPE_CODE_LENGTH" :key="slot" class="shapes__slot">
        <svg
          v-if="chosen[slot - 1] !== undefined"
          viewBox="0 0 24 24"
          width="34"
          height="34"
        >
          <path
            :d="SHAPE_PATHS[Number(chosen[slot - 1])]"
            fill="currentColor"
          />
        </svg>
      </span>
    </div>
    <p class="sr-only" role="status" aria-live="polite">
      {{
        t("studio.shapes.chosen", {
          count: chosen.length,
          total: SHAPE_CODE_LENGTH,
        })
      }}
    </p>
    <div class="shapes__grid">
      <button
        v-for="shape in SHAPES"
        :key="shape.id"
        type="button"
        class="shapes__key"
        :aria-label="t(`studio.shapes.s${shape.id}`)"
        :disabled="
          isDisabled ||
          chosen.includes(String(shape.id)) ||
          chosen.length >= SHAPE_CODE_LENGTH
        "
        @click="pick(shape.id)"
      >
        <svg viewBox="0 0 24 24" width="44" height="44" aria-hidden="true">
          <path :d="SHAPE_PATHS[shape.id]" fill="currentColor" />
        </svg>
      </button>
    </div>
    <button
      type="button"
      class="btn btn--white btn--small"
      :disabled="isDisabled || chosen === ''"
      @click="clear"
    >
      {{ t("studio.shapes.clear") }}
    </button>
  </div>
</template>

<script setup lang="ts">
const SHAPE_PATHS: Record<number, string> = {
  0: "M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18z",
  1: "M4 4h16v16H4z",
  2: "M12 3l10 18H2z",
  3: "M12 2l3 7 7.5.6-5.7 4.9 1.8 7.3L12 18l-6.6 3.8 1.8-7.3L1.5 9.6 9 9z",
};

const { isDisabled = false } = defineProps<{ isDisabled?: boolean }>();
const emit = defineEmits<{ submit: [value: string]; clear: [] }>();

const { t } = useI18n();

const chosen = ref("");

const pick = (id: number): void => {
  if (
    chosen.value.length >= SHAPE_CODE_LENGTH ||
    chosen.value.includes(String(id))
  ) {
    return;
  }
  chosen.value += String(id);
  if (chosen.value.length === SHAPE_CODE_LENGTH) {
    emit("submit", chosen.value);
  }
};

const clear = (): void => {
  chosen.value = "";
  emit("clear");
};

defineExpose({ clear });
</script>

<style scoped>
.shapes {
  align-items: center;
}

.shapes__slots {
  display: flex;
  gap: 14px;
}

.shapes__slot {
  width: 58px;
  height: 58px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 3px dashed var(--ink);
  border-radius: 18px;
  background: var(--paper);
  color: var(--ink);
}

.shapes__grid {
  display: grid;
  grid-template-columns: repeat(2, 104px);
  gap: 14px;
}

.shapes__key {
  width: 104px;
  height: 104px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 3px solid var(--ink);
  border-radius: 26px;
  background: var(--sun);
  box-shadow: 4px 4px 0 var(--ink);
  color: var(--ink);
  cursor: pointer;
}


.shapes__key:active:not(:disabled) {
  transform: translate(3px, 3px);
  box-shadow: 0 0 0 var(--ink);
}

.shapes__key:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  padding: 0;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
</style>
