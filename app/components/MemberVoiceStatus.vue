<template>
    <section v-if="member" class="card stack" aria-labelledby="voice-status-title">
        <h2 id="voice-status-title" class="subtitle">Situation de cette voix</h2>
        <div class="row row--wrap" role="group" aria-label="Situation">
            <button
                v-for="option in statuses"
                :key="option.value"
                type="button"
                class="chip"
                :class="{ 'chip--on': member.status === option.value }"
                :aria-pressed="member.status === option.value"
                :disabled="isBusy"
                @click="setStatus(option.value)"
            >
                {{ option.label }}
            </button>
        </div>
        <fieldset v-if="isHousehold" class="stack fieldset">
            <legend class="label">Que faire des livres avec cette voix ?</legend>
            <label v-for="option in policies" :key="option.value" class="row">
                <input
                    type="radio"
                    name="voice-policy"
                    :value="option.value"
                    :checked="member.voicePolicy === option.value"
                    :disabled="isBusy"
                    @change="setPolicy(option.value)"
                />
                <span>{{ option.label }}</span>
            </label>
        </fieldset>
        <p v-if="isBlocked" class="muted" role="status">Les enfants ne peuvent plus écouter les livres qui contiennent cette voix, jusqu’à ce que ses répliques soient réenregistrées par quelqu’un d’autre.</p>
        <ul v-if="books.length > 0" class="list stack">
            <li v-for="book in books" :key="book.id" class="row">
                <span class="grow">{{ book.title }} · {{ book.lineCount }} répliques</span>
                <NuxtLink v-if="isBlocked" :to="`/books/${book.id}/studio`" class="btn btn--white btn--small">Réenregistrer</NuxtLink>
            </li>
        </ul>
        <p v-else class="muted">Cette voix n’est dans aucun livre pour l’instant.</p>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </section>
</template>

<script setup lang="ts">
const { memberId } = defineProps<{ memberId: string }>()

const statuses: { value: MemberStatus; label: string }[] = [
    { value: 'active', label: 'Présent' },
    { value: 'blocked', label: 'Bloqué' },
    { value: 'left', label: 'A quitté le foyer' },
    { value: 'deceased', label: 'Décédé' },
]
const policies: { value: VoicePolicy; label: string }[] = [
    { value: 'keep', label: 'Garder les livres tels quels' },
    { value: 'block', label: 'Bloquer ces livres pour les enfants' },
    { value: 'rerecord', label: 'Demander de réenregistrer ces répliques' },
]

const { request } = useApi()
const { getById, update } = useMembers()
const { load: reloadBooks } = useBooks()

const books = ref<IVoiceBook[]>([])
const isBusy = ref(false)
const errorMessage = ref('')

const member = computed(() => getById(memberId))
const isHousehold = computed(() => member.value?.status === 'left' || member.value?.status === 'deceased')
const isBlocked = computed(() => (member.value ? isVoiceBlocked(member.value.status, member.value.voicePolicy) : false))

const loadBooks = async (): Promise<void> => {
    try {
        books.value = await request<IVoiceBook[]>(`/members/${memberId}/voice-books`)
    } catch (_error) {
        books.value = []
    }
}

const save = async (patch: Partial<IMember>): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        await update(memberId, patch)
        await reloadBooks()
    } catch (_error) {
        errorMessage.value = 'Le changement n’a pas pu être enregistré.'
    } finally {
        isBusy.value = false
    }
}

const setStatus = (status: MemberStatus): Promise<void> => save({ status })
const setPolicy = (voicePolicy: VoicePolicy): Promise<void> => save({ voicePolicy })

onMounted(loadBooks)
</script>

<style scoped>
.fieldset {
    border: 0;
    padding: 0;
    margin: 0;
}

.list {
    list-style: none;
    padding: 0;
    margin: 0;
}
</style>
