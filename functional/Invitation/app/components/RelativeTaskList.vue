<template>
    <div class="task-list">
        <p v-if="navigationError" class="error" role="alert">{{ navigationError }}</p>
        <ul class="task-list__items">
            <li v-for="task in tasks" :key="task.key" data-testid="category-row">
                <button class="task-list__card" type="button" :disabled="isOpening" @click="openFamily(task.familyId, task.path)">
                    <span class="task-list__cover" :style="{ background: pickVoiceByText(task.key).hex }" aria-hidden="true"><AppIcon name="book" :size="24" /></span>
                    <span class="task-list__body">
                        <strong class="task-list__title">{{ task.title }}</strong>
                        <span class="task-list__meta">{{ task.subtitle }}</span>
                        <span v-if="task.comment" class="task-list__comment">« {{ task.comment }} »<span v-if="task.author"> — {{ task.author }}</span></span>
                    </span>
                    <span class="task-list__action" :class="{ 'task-list__action--record': kind === 'toRecord' }">{{ task.action }}</span>
                </button>
            </li>
        </ul>
    </div>
</template>

<script setup lang="ts">
import type { IRelativeTask } from '../composables/useRelativeTasks'

defineProps<{ tasks: IRelativeTask[]; kind: 'toRecord' | 'proposals' | 'toFix' }>()
const { isOpening, navigationError, openFamily } = useFamilyNavigation()
</script>

<style scoped>
.task-list__items {
    display: grid;
    gap: 16px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.task-list__card {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 16px;
    width: 100%;
    padding: 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 24px;
    box-shadow: var(--shadow-lg);
    background: var(--paper);
    color: var(--ink);
    text-align: start;
    font: inherit;
    cursor: pointer;
}

.task-list__cover {
    display: grid;
    place-items: center;
    flex: none;
    width: 56px;
    height: 76px;
    border: var(--outline) solid var(--line);
    border-radius: 12px;
    color: var(--on-accent);
}

.task-list__body {
    display: grid;
    flex: 1 1 120px;
    min-width: 0;
    gap: 8px;
    overflow-wrap: anywhere;
}

.task-list__title {
    font-size: 1.125rem;
}

.task-list__meta {
    color: var(--ink-soft);
    font-size: 0.9375rem;
}

.task-list__comment {
    padding: 12px;
    border-radius: 16px;
    background: var(--bg);
}

.task-list__action {
    padding: 8px 12px;
    border: var(--outline) solid var(--ink);
    border-radius: 24px;
    background: var(--yellow);
    color: var(--on-accent);
    font-weight: 700;
    overflow-wrap: anywhere;
}

.task-list__action--record {
    background: var(--mint);
}

.task-list__card:disabled {
    cursor: progress;
    opacity: 0.7;
}
</style>
