<template>
    <section class="stack parental" aria-labelledby="parental-title" data-testid="parental">
        <h2 id="parental-title" class="subtitle">{{ t('parental.schedule.title') }}</h2>
        <p class="muted" role="status" data-testid="parental-status">{{ statusLabel }}</p>
        <div class="row row--wrap">
            <AppButton variant="secondary" size="sm" :disabled="isBusy" data-testid="block-now" @click="blockNow">
                {{ t('parental.schedule.blockNow') }}
            </AppButton>
            <AppButton size="sm" v-if="schedule?.isManualBlock" :disabled="isBusy" data-testid="block-clear" @click="clearBlock">
                {{ t('parental.schedule.restore') }}
            </AppButton>
        </div>
        <div class="row row--wrap parental__until">
            <label class="stack" style="gap: 6px">
                <span class="label">{{ t('parental.schedule.until') }}</span>
                <input v-model="untilTime" class="input" type="time" data-testid="block-until-time" />
            </label>
            <AppButton variant="secondary" size="sm" :disabled="isBusy || untilTime === ''" data-testid="block-until" @click="blockUntil">
                {{ t('parental.schedule.untilButton') }}
            </AppButton>
        </div>
        <AppToggle v-model="isEnabled" class="parental__toggle" data-testid="schedule-enabled">{{ t('parental.schedule.enabled') }}</AppToggle>
        <ul class="parental__days" :aria-label="t('parental.schedule.daysLabel')">
            <li v-for="day in orderedDays" :key="day.index" class="parental__day card">
                <AppCheckbox v-model="weekly[day.index]!.isOpen" class="parental__toggle" :data-testid="`day-open-${day.index}`">{{ day.label }}</AppCheckbox>
                <div v-if="weekly[day.index]!.isOpen" class="row row--wrap">
                    <label class="stack" style="gap: 4px">
                        <span class="muted">{{ t('parental.schedule.from') }}</span>
                        <input v-model="weekly[day.index]!.from" class="input" type="time" :data-testid="`day-from-${day.index}`" />
                    </label>
                    <label class="stack" style="gap: 4px">
                        <span class="muted">{{ t('parental.schedule.to') }}</span>
                        <input v-model="weekly[day.index]!.to" class="input" type="time" :data-testid="`day-to-${day.index}`" />
                    </label>
                </div>
                <p v-else class="muted">{{ t('parental.schedule.dayOff') }}</p>
            </li>
        </ul>
        <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
        <AppButton is-block :disabled="isBusy" data-testid="schedule-save" @click="save">{{ t('parental.schedule.save') }}</AppButton>
    </section>
</template>

<script setup lang="ts">
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

const { memberId } = defineProps<{ memberId: string }>()

const { t, formatDate } = useI18n()
const { load, save: saveSchedule, block } = useParental()

const schedule = ref<IChildSchedule | null>(null)
const isEnabled = ref(false)
const weekly = ref<IDayWindow[]>(defaultWeekly())
const untilTime = ref('')
const isBusy = ref(false)
const errorMessage = ref('')

const SUNDAY_REFERENCE = Date.UTC(2023, 0, 1, 12)
const MS_PER_DAY = 86_400_000
const dayName = (index: number): string => formatDate(SUNDAY_REFERENCE + index * MS_PER_DAY, { weekday: 'long', timeZone: 'UTC' })
const orderedDays = computed(() => WEEK_ORDER.map(index => ({ index, label: dayName(index) })))
const deviceTimezone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone

const statusLabel = computed(() => {
    if (!schedule.value?.isManualBlock) {
        return isEnabled.value ? t('parental.schedule.limited') : t('parental.schedule.free')
    }
    if (schedule.value.manualUntil === null) {
        return t('parental.schedule.blockedManual')
    }
    const time = formatDate(schedule.value.manualUntil, { timeStyle: 'short' })
    return t('parental.schedule.blockedUntil', { time })
})

const refresh = async (): Promise<void> => {
    schedule.value = await load(memberId)
    isEnabled.value = schedule.value.isEnabled
    weekly.value = schedule.value.weekly.map(window => ({ ...window }))
}

const run = async (action: () => Promise<void>): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        await action()
        await refresh()
    } catch (error) {
        console.error('Les horaires n ont pas pu être enregistrés', error)
        errorMessage.value = t('parental.schedule.saveFailed')
    } finally {
        isBusy.value = false
    }
}

const save = (): Promise<void> => run(() => saveSchedule(memberId, { isEnabled: isEnabled.value, weekly: weekly.value, timezone: deviceTimezone() }))

const blockNow = (): Promise<void> => run(() => block(memberId, { mode: 'now' }))

const clearBlock = (): Promise<void> => run(() => block(memberId, { mode: 'clear' }))

const blockUntil = (): Promise<void> => {
    const [hours = 0, minutes = 0] = untilTime.value.split(':').map(Number)
    const target = new Date()
    target.setHours(hours, minutes, 0, 0)
    if (target.getTime() <= Date.now()) {
        target.setDate(target.getDate() + 1)
    }
    return run(() => block(memberId, { mode: 'until', until: target.toISOString() }))
}

onMounted(refresh)
</script>

<style scoped>
.parental {
    font-size: 1rem;
    overflow-wrap: anywhere;
}

.parental__days {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 0.75rem;
}

.parental__day {
    display: grid;
    gap: 0.5rem;
}

.parental__toggle {
    align-items: center;
    gap: 0.75rem;
}

.parental__toggle input[type='checkbox'] {
    width: 1.5rem;
    height: 1.5rem;
    flex: none;
}

.parental__until {
    align-items: flex-end;
}
</style>
