<template>
    <div class="stack lock">
        <BackLink to="/family" />
        <h1 class="title">{{ t('lock.title') }}</h1>

        <AppEmpty v-if="children.length === 0" :title="t('lock.noChildTitle')" :hint="t('lock.noChildHint')" />

        <template v-else>
            <div class="row row--wrap lock__children" role="tablist" :aria-label="t('lock.children')">
                <AppChip
                    v-for="child in children"
                    :key="child.id"
                    role="tab"
                    :selected="child.id === selectedId"
                    :aria-selected="child.id === selectedId ? 'true' : 'false'"
                    :data-testid="`lock-child-${child.id}`"
                    @click="select(child.id)"
                >
                    <AppAvatar :member="child" :size="28" />{{ child.name }}
                </AppChip>
            </div>

            <template v-if="rule && current">
                <AppToggle :model-value="rule.isEnabled" data-testid="lock-enabled" @update:model-value="patch({ isEnabled: $event })">
                    <span class="lock__toggle-text">
                        <span class="lock__toggle-title">{{ t('lock.enabled', { name: current.name }) }}</span>
                        <span class="lock__hint">{{ rule.isEnabled ? t('lock.enabledHint') : t('lock.disabledHint') }}</span>
                    </span>
                </AppToggle>

                <AppToggle :model-value="isHomeworkOn" :disabled="isHomeworkBusy" data-testid="homework-follow" @update:model-value="setHomework">
                    <span class="lock__toggle-text">
                        <span class="lock__toggle-title">{{ t('homework.follow.title', { name: current.name }) }}</span>
                        <span class="lock__hint">{{ t('homework.follow.hint') }}</span>
                    </span>
                </AppToggle>

                <AccessControls :member-id="current.id" :name="current.name" />

                <div class="stack lock__rule" :class="{ 'lock__rule--off': !rule.isEnabled }">
                    <section class="stack lock__card" aria-labelledby="lock-days">
                        <h2 id="lock-days" class="subtitle">{{ t('lock.days') }}</h2>
                        <div class="row lock__days" role="group" :aria-label="t('lock.days')">
                            <AppChip
                                v-for="day in DAYS"
                                :key="day"
                                class="lock__day"
                                :selected="rule.days.includes(day)"
                                :disabled="!rule.isEnabled"
                                :aria-label="dayName(day)"
                                :data-testid="`lock-day-${day}`"
                                @click="toggleDay(day)"
                            >
                                {{ dayInitial(day) }}
                            </AppChip>
                        </div>
                        <div class="row row--wrap">
                            <AppChip v-for="preset in PRESETS" :key="preset" :disabled="!rule.isEnabled" @click="patch({ days: PRESET_DAYS[preset] })">
                                {{ t(`lock.presets.${preset}`) }}
                            </AppChip>
                        </div>
                    </section>

                    <section class="stack lock__card" aria-labelledby="lock-hours">
                        <h2 id="lock-hours" class="subtitle">{{ t('lock.hours') }}</h2>
                        <div v-for="key in TIME_KEYS" :key="key" class="row lock__time">
                            <span class="lock__time-label grow">{{ t(`lock.${key}`) }}</span>
                            <AppIconButton icon="chevron-down" :label="t('lock.less')" :disabled="!rule.isEnabled" @click="step(key, -1)" />
                            <output class="lock__time-value">{{ formatMinutes(rule[key]) }}</output>
                            <AppIconButton icon="plus" :label="t('lock.more')" :disabled="!rule.isEnabled" @click="step(key, 1)" />
                        </div>
                    </section>

                    <p class="lock__summary" role="status">{{ summary }}</p>
                </div>

                <p v-if="hasFailed" class="error" role="alert">{{ t('lock.failed') }}</p>
                <AppButton is-block :icon="isSaved ? 'check' : 'lock'" :disabled="isBusy" data-testid="lock-save" @click="persist">
                    {{ isSaved ? t('lock.saved') : t('lock.save') }}
                </AppButton>
            </template>
        </template>
    </div>
</template>

<script setup lang="ts">
import { LOCK_PRESETS } from '~~/shared/utils/lockRule'

const DAYS = [0, 1, 2, 3, 4, 5, 6]
const PRESETS: ('week' | 'weekend' | 'all')[] = ['week', 'weekend', 'all']
const PRESET_DAYS = LOCK_PRESETS
const TIME_KEYS: ('from' | 'to')[] = ['from', 'to']
const MONDAY_REFERENCE = Date.UTC(2023, 0, 2, 12)
const MS_PER_DAY = 86_400_000

const { t, formatDate } = useI18n()
const { children, selectedId, rule, isBusy, isSaved, hasFailed, init, select, patch, toggleDay, step, persist } = useLockRule()

const current = computed<IMember | null>(() => children.value.find(child => child.id === selectedId.value) ?? null)

const dayName = (day: number): string => formatDate(MONDAY_REFERENCE + day * MS_PER_DAY, { weekday: 'long', timeZone: 'UTC' })
const dayInitial = (day: number): string => formatDate(MONDAY_REFERENCE + day * MS_PER_DAY, { weekday: 'narrow', timeZone: 'UTC' })

const summary = computed<string>(() => {
    const value = rule.value
    const child = current.value
    if (!value || !child) {
        return ''
    }
    if (!value.isEnabled) {
        return t('lock.summaryOff', { name: child.name })
    }
    if (value.days.length === 0) {
        return t('lock.summaryNoDay', { name: child.name })
    }
    const names = value.days.map(dayName)
    const list = value.days.length === DAYS.length ? t('lock.everyDay') : names.join(', ')
    return t('lock.summary', { name: child.name, days: list, from: formatMinutes(value.from), to: formatMinutes(value.to) })
})

const { loadFollow, saveFollow } = useHomeworkGate()
const isHomeworkOn = ref(false)
const isHomeworkBusy = ref(false)

const syncHomework = async (id: string | null): Promise<void> => {
    isHomeworkOn.value = false
    if (!id) {
        return
    }
    try {
        isHomeworkOn.value = await loadFollow(id)
    } catch (_error) {
        hasFailed.value = true
    }
}

const setHomework = async (value: boolean): Promise<void> => {
    const id = selectedId.value
    if (!id) {
        return
    }
    isHomeworkBusy.value = true
    try {
        await saveFollow(id, value)
        isHomeworkOn.value = value
    } catch (_error) {
        hasFailed.value = true
    } finally {
        isHomeworkBusy.value = false
    }
}

watch(selectedId, syncHomework)

onMounted(init)
</script>

<style scoped>
.lock {
    gap: 24px;
}

.lock__children :deep(.chip) {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    min-height: 64px;
}

.lock__toggle-text {
    display: flex;
    flex-direction: column;
}

.lock__toggle-title {
    font: 700 1.0625rem/1.2 var(--font-title);
}

.lock__hint {
    color: var(--ink-soft);
    font: 600 0.875rem/1.3 var(--font-body);
}

.lock__rule--off {
    opacity: 0.55;
}

.lock__card {
    padding: 14px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
    box-shadow: var(--shadow);
}

.lock__days {
    flex-wrap: nowrap;
    gap: 6px;
}

.lock__day {
    flex: 1;
    min-width: 0;
    padding-inline: 0;
    justify-content: center;
}

.lock__time {
    gap: 10px;
}

.lock__time-label {
    font: 700 1.0625rem/1.2 var(--font-title);
}

.lock__time-value {
    min-width: 4.5ch;
    text-align: center;
    font: 700 1.5rem/1 var(--font-title);
    font-variant-numeric: tabular-nums;
}

.lock__summary {
    margin: 0;
    color: var(--ink-soft);
    font: 600 1rem/1.4 var(--font-body);
}
</style>
