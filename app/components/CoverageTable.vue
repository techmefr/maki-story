<template>
    <section class="coverage stack" aria-labelledby="coverage-title">
        <h2 id="coverage-title" class="subtitle">Couverture des voix</h2>
        <ul class="coverage__progress">
            <li v-for="row in progressRows" :key="row.memberId" class="coverage__who">
                <strong>{{ row.name }}</strong>
                <span v-for="cell in row.cells" :key="cell.language" class="badge">{{ cell.label }} {{ cell.done }}/{{ cell.total }}</span>
            </li>
        </ul>
        <div class="coverage__scroll">
            <table class="coverage__table">
                <caption class="sr-only">
                    Une ligne par réplique, une colonne par langue. Touche une case pour aller à la réplique.
                </caption>
                <thead>
                    <tr>
                        <th scope="col">Réplique</th>
                        <th v-for="language in languages" :key="language" scope="col">{{ languageLabel(language) }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="line in lines" :key="line.id">
                        <th scope="row" class="coverage__line">
                            <span class="coverage__page">Page {{ line.pageIndex + 1 }}</span>
                            <span>{{ line.character || 'Narrateur' }}</span>
                        </th>
                        <td v-for="language in languages" :key="language">
                            <button
                                type="button"
                                class="coverage__cell"
                                :class="`coverage__cell--${stateOf(line, language)}`"
                                :aria-label="`Page ${line.pageIndex + 1}, ${line.character || 'Narrateur'}, ${languageLabel(language)} : ${STATE_LABELS[stateOf(line, language)]}`"
                                @click="emit('select', line.id, language)"
                            >
                                {{ STATE_MARKS[stateOf(line, language)] }}
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <p class="muted">✓ fait · ↻ à refaire · ○ manquant</p>
    </section>
</template>

<script setup lang="ts">
type CoverageState = 'done' | 'stale' | 'missing'

const STATE_LABELS: Record<CoverageState, string> = { done: 'fait', stale: 'à refaire', missing: 'manquant' }
const STATE_MARKS: Record<CoverageState, string> = { done: '✓', stale: '↻', missing: '○' }

const { lines, recordings, languages, getMemberName } = defineProps<{
    lines: ILine[]
    recordings: ILineRecording[]
    languages: string[]
    getMemberName: (memberId: string) => string
}>()

const emit = defineEmits<{ select: [lineId: string, language: string] }>()

const stateOf = (line: ILine, language: string): CoverageState => {
    const recording = recordings.find(item => item.lineId === line.id && item.language === language)
    if (!recording) {
        return 'missing'
    }
    return recording.status === 'stale' ? 'stale' : 'done'
}

const progressRows = computed(() => {
    const memberIds = [...new Set(lines.map(line => line.memberId).filter((id): id is string => id !== null))]
    return memberIds.map(memberId => {
        const own = lines.filter(line => line.memberId === memberId)
        return {
            memberId,
            name: getMemberName(memberId),
            cells: languages.map(language => ({
                language,
                label: languageLabel(language),
                done: own.filter(line => stateOf(line, language) === 'done').length,
                total: own.length,
            })),
        }
    })
})
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
    font: 700 14px/1.2 var(--font-body);
}

.coverage__table th,
.coverage__table td {
    padding: 6px 8px;
    text-align: center;
    border-bottom: 1.5px solid var(--ink);
}

.coverage__line {
    text-align: left;
    display: grid;
}

.coverage__page {
    font: 700 12px/1.2 var(--font-title);
    opacity: 0.7;
}

.coverage__cell {
    min-width: 48px;
    min-height: 44px;
    border: 2.5px solid var(--ink);
    border-radius: 12px;
    background: var(--paper);
    font: 700 18px/1 var(--font-title);
    cursor: pointer;
}

.coverage__cell--done {
    background: var(--mint);
}

.coverage__cell--stale {
    background: var(--sun);
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
