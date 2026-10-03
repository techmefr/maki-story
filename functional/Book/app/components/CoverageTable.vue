<template>
  <section class="coverage stack" aria-labelledby="coverage-title">
    <h2 id="coverage-title" class="subtitle">
      {{ t("studio.coverage.title") }}
    </h2>
    <ul class="coverage__progress">
      <li v-for="row in progressRows" :key="row.memberId" class="coverage__who">
        <strong>{{ row.name }}</strong>
        <span v-for="cell in row.cells" :key="cell.language" class="badge"
          >{{ cell.label }} {{ cell.done }}/{{ cell.total }}</span
        >
      </li>
    </ul>
    <div class="coverage__scroll">
      <table class="coverage__table">
        <caption class="sr-only">
          {{
            t("studio.coverage.caption")
          }}
        </caption>
        <thead>
          <tr>
            <th scope="col">{{ t("studio.coverage.line") }}</th>
            <th v-for="language in languages" :key="language" scope="col">
              {{ languageLabel(language) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="line in lines" :key="line.id">
            <th scope="row" class="coverage__line">
              <span class="coverage__page">{{
                t("studio.coverage.page", { page: line.pageIndex + 1 })
              }}</span>
              <span>{{ line.character || t("studio.narrator") }}</span>
            </th>
            <td v-for="language in languages" :key="language">
              <button
                type="button"
                class="coverage__cell"
                :class="`coverage__cell--${stateOf(line, language)}`"
                :aria-label="cellLabel(line, language)"
                @click="emit('select', line.id, language)"
              >
                {{ STATE_MARKS[stateOf(line, language)] }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="muted">{{ t("studio.coverage.legend") }}</p>
  </section>
</template>

<script setup lang="ts">
type CoverageState = "done" | "stale" | "missing";

const { t } = useI18n();

const STATE_MARKS: Record<CoverageState, string> = {
  done: "✓",
  stale: "↻",
  missing: "○",
};

const { lines, recordings, languages, getMemberName } = defineProps<{
  lines: ILine[];
  recordings: ILineRecording[];
  languages: string[];
  getMemberName: (memberId: string) => string;
}>();

const emit = defineEmits<{ select: [lineId: string, language: string] }>();

const stateOf = (line: ILine, language: string): CoverageState => {
  const recording = recordings.find(
    (item) => item.lineId === line.id && item.language === language,
  );
  if (!recording) {
    return "missing";
  }
  return recording.status === "stale" ? "stale" : "done";
};

const cellLabel = (line: ILine, language: string): string =>
  t("studio.coverage.cell", {
    page: line.pageIndex + 1,
    character: line.character || t("studio.narrator"),
    language: languageLabel(language),
    state: t(`studio.coverage.${stateOf(line, language)}`),
  });

const progressRows = computed(() => {
  const memberIds = [
    ...new Set(
      lines
        .map((line) => line.memberId)
        .filter((id): id is string => id !== null),
    ),
  ];
  return memberIds.map((memberId) => {
    const own = lines.filter((line) => line.memberId === memberId);
    return {
      memberId,
      name: getMemberName(memberId),
      cells: languages.map((language) => ({
        language,
        label: languageLabel(language),
        done: own.filter((line) => stateOf(line, language) === "done").length,
        total: own.length,
      })),
    };
  });
});
</script>

<style scoped>
.coverage__progress {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.coverage__who {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.coverage__scroll {
  overflow-x: auto;
  border: 3px solid var(--ink);
  border-radius: 14px;
  background: var(--paper);
  box-shadow: var(--shadow);
}

.coverage__table {
    border-collapse: collapse;
    width: 100%;
    font: 700 0.875rem/1.2 var(--font-body);
}

.coverage__table th,
.coverage__table td {
  padding: 6px 8px;
  text-align: center;
  border-bottom: 1.5px solid var(--ink);
}

.coverage__line {
  text-align: start;
  display: grid;
}

.coverage__page {
    font: 700 0.75rem/1.2 var(--font-title);
    color: var(--ink-soft);
}

.coverage__cell {
    min-width: 48px;
    min-height: 44px;
    border: 2.5px solid var(--ink);
    border-radius: 12px;
    background: var(--paper);
    font: 700 1.125rem/1 var(--font-title);
    cursor: pointer;
}

.coverage__cell--done {
  background: var(--mint);
  color: var(--on-accent);
}

.coverage__cell--stale {
  background: var(--yellow);
  color: var(--on-accent);
}

.coverage__cell:focus-visible {
  outline: 3px solid var(--ink);
  outline-offset: 2px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
