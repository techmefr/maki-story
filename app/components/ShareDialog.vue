<template>
    <div class="sheet-backdrop" @click.self="emit('close')">
        <form class="sheet stack" role="dialog" aria-modal="true" aria-labelledby="share-title" @submit.prevent="submit">
            <h2 id="share-title" class="subtitle">Partager « {{ book.title }} »</h2>
            <label class="stack" style="gap: 6px">
                <span class="label">Code de la famille</span>
                <input v-model="code" class="input" autocomplete="off" autocapitalize="none" spellcheck="false" required />
            </label>
            <fieldset class="stack fieldset">
                <legend class="label">Comment partager ?</legend>
                <label class="row">
                    <input v-model="mode" type="radio" value="record" />
                    <span>Enregistrer ma voix pour ce livre</span>
                </label>
                <label class="row">
                    <input v-model="mode" type="radio" value="copy" />
                    <span>Copier dans sa bibliothèque</span>
                </label>
            </fieldset>
            <fieldset v-if="mode === 'record'" class="stack fieldset">
                <legend class="label">Répliques à enregistrer</legend>
                <p v-if="lines.length === 0" class="muted">Chargement…</p>
                <label v-for="line in lines" :key="line.id" class="row">
                    <input v-model="selected" type="checkbox" :value="line.id" />
                    <span>{{ line.character ? `${line.character} : ` : '' }}{{ line.text }}</span>
                </label>
            </fieldset>
            <label class="stack" style="gap: 6px">
                <span class="label">Un petit mot (facultatif)</span>
                <input v-model="message" class="input" maxlength="200" />
            </label>
            <p v-if="statusMessage" class="muted" role="status">{{ statusMessage }}</p>
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
            <button type="submit" class="btn btn--block" :disabled="!canSubmit || isBusy">Envoyer</button>
            <button type="button" class="btn btn--white btn--block" @click="emit('close')">Fermer</button>
        </form>
    </div>
</template>

<script setup lang="ts">
const { book } = defineProps<{ book: IBookSummary }>()
const emit = defineEmits<{ close: [] }>()

const { get } = useBooks()
const { create } = useShares()

const code = ref('')
const mode = ref<ShareMode>('copy')
const message = ref('')
const lines = ref<ILine[]>([])
const selected = ref<string[]>([])
const isBusy = ref(false)
const errorMessage = ref('')
const statusMessage = ref('')

const canSubmit = computed(() => code.value.trim() !== '' && (mode.value === 'copy' || selected.value.length > 0))

const ERRORS: Record<number, string> = {
    404: 'Ce code ne correspond à aucune famille.',
    409: 'Ce livre est déjà partagé ainsi, ou il a atteint le nombre maximum de familles.',
    429: 'Trop d’essais. Réessaie dans quelques minutes.',
    403: 'Ton profil ne peut pas partager ce livre.',
}

watch(mode, async value => {
    if (value === 'record' && lines.value.length === 0) {
        const full = await get(book.id)
        lines.value = full.lines
        selected.value = full.lines.filter(line => line.audioFileId === null).map(line => line.id)
    }
})

const submit = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    statusMessage.value = ''
    try {
        const result = await create({
            bookId: book.id,
            code: code.value,
            mode: mode.value,
            lineIds: mode.value === 'record' ? selected.value : undefined,
            message: message.value,
        })
        statusMessage.value =
            result.status === 'pending'
                ? `Envoyé à la famille ${result.targetFamilyName}.`
                : 'Enregistré : un parent doit valider avant l’envoi.'
    } catch (error) {
        const status = (error as { statusCode?: number }).statusCode ?? 0
        errorMessage.value = ERRORS[status] ?? 'Le partage n’a pas pu être envoyé.'
    } finally {
        isBusy.value = false
    }
}
</script>

<style scoped>
.fieldset {
    border: 0;
    padding: 0;
    margin: 0;
}
</style>
