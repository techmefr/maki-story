<template>
    <section class="stack parental" aria-labelledby="parental-title" data-testid="parental">
        <h2 id="parental-title" class="subtitle">Temps d’écoute</h2>
        <p class="muted" role="status" data-testid="parental-status">{{ statusLabel }}</p>
        <div class="row row--wrap">
            <button type="button" class="btn btn--white btn--small" :disabled="isBusy" data-testid="block-now" @click="blockNow">
                Couper maintenant
            </button>
            <button v-if="schedule?.isManualBlock" type="button" class="btn btn--small" :disabled="isBusy" data-testid="block-clear" @click="clearBlock">
                Rétablir
            </button>
        </div>
        <div class="row row--wrap parental__until">
            <label class="stack" style="gap: 6px">
                <span class="label">Couper jusqu’à</span>
                <input v-model="untilTime" class="input" type="time" data-testid="block-until-time" />
            </label>
            <button type="button" class="btn btn--white btn--small" :disabled="isBusy || untilTime === ''" data-testid="block-until" @click="blockUntil">
                Couper jusqu’à cette heure
            </button>
        </div>
        <label class="row parental__toggle">
            <input v-model="isEnabled" type="checkbox" data-testid="schedule-enabled" />
            <span class="label">Limiter l’écoute aux horaires ci-dessous</span>
        </label>
        <ul class="parental__days" aria-label="Horaires par jour">
            <li v-for="day in orderedDays" :key="day.index" class="parental__day card">
                <label class="row parental__toggle">
                    <input v-model="weekly[day.index]!.isOpen" type="checkbox" :data-testid="`day-open-${day.index}`" />
                    <span class="label">{{ day.label }}</span>
                </label>
                <div v-if="weekly[day.index]!.isOpen" class="row row--wrap">
                    <label class="stack" style="gap: 4px">
                        <span class="muted">De</span>
                        <input v-model="weekly[day.index]!.from" class="input" type="time" :data-testid="`day-from-${day.index}`" />
                    </label>
                    <label class="stack" style="gap: 4px">
                        <span class="muted">À</span>
                        <input v-model="weekly[day.index]!.to" class="input" type="time" :data-testid="`day-to-${day.index}`" />
                    </label>
                </div>
                <p v-else class="muted">Jour sans écoute</p>
            </li>
        </ul>
        <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
        <button type="button" class="btn btn--block" :disabled="isBusy" data-testid="schedule-save" @click="save">Appliquer les horaires</button>
    </section>
</template>

<script setup lang="ts">
const DAY_LABELS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

const { memberId } = defineProps<{ memberId: string }>()

const { load, save: saveSchedule, block } = useParental()

const schedule = ref<IChildSchedule | null>(null)
const isEnabled = ref(false)
const weekly = ref<IDayWindow[]>(defaultWeekly())
const untilTime = ref('')
const isBusy = ref(false)
const errorMessage = ref('')

const orderedDays = WEEK_ORDER.map(index => ({ index, label: DAY_LABELS[index]! }))
const deviceTimezone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone

const statusLabel = computed(() => {
    if (!schedule.value?.isManualBlock) {
        return isEnabled.value ? 'Écoute limitée aux horaires.' : 'Écoute libre.'
    }
    if (schedule.value.manualUntil === null) {
        return 'Écoute coupée jusqu’à ce que tu la rétablisses.'
    }
    const time = new Date(schedule.value.manualUntil).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    return `Écoute coupée jusqu’à ${time}.`
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
        errorMessage.value = 'Impossible d’enregistrer pour le moment. Vérifie que chaque heure de début précède l’heure de fin.'
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
