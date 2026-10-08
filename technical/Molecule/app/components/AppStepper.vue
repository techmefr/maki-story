<template>
    <nav :aria-label="label">
        <ol class="stepper">
            <li
                v-for="(step, index) in steps"
                :key="step.id"
                class="stepper__step"
                :class="{ 'stepper__step--done': index < current, 'stepper__step--current': index === current }"
                :aria-current="index === current ? 'step' : undefined"
                :data-testid="`step-${step.id}`"
            >
                <span class="stepper__dot" aria-hidden="true">
                    <AppIcon v-if="index < current" name="check" :size="16" />
                    <template v-else>{{ index + 1 }}</template>
                </span>
                <span class="stepper__label">{{ step.label }}</span>
            </li>
        </ol>
    </nav>
</template>

<script setup lang="ts">
export interface IStep {
    id: string
    label: string
}

defineProps<{ steps: IStep[]; current: number; label: string }>()
</script>

<style scoped>
.stepper {
    display: flex;
    gap: 6px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.stepper__step {
    display: flex;
    flex: 1 1 0;
    min-width: 0;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    color: var(--ink-soft);
    text-align: center;
}

.stepper__dot {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border: 2.5px solid var(--ink);
    border-radius: 50%;
    background: var(--paper);
    color: var(--ink);
    font: 700 0.875rem/1 var(--font-title);
}

.stepper__step--done .stepper__dot {
    background: var(--mint);
    color: var(--on-accent);
}

.stepper__step--current {
    color: var(--ink);
}

.stepper__step--current .stepper__dot {
    background: var(--chip-on-bg);
    color: var(--chip-on-ink);
    box-shadow: var(--shadow);
}

.stepper__label {
    max-width: 100%;
    font: 700 0.75rem/1.2 var(--font-title);
    overflow-wrap: anywhere;
}
</style>
