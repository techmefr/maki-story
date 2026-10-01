<template>
    <section class="stack code-admin" aria-labelledby="code-admin-title" data-testid="code-admin">
        <h2 id="code-admin-title" class="subtitle">Code du profil</h2>
        <p class="muted" role="status" data-testid="code-state">{{ stateLabel }}</p>
        <div class="row row--wrap">
            <button v-if="member.isCodeLocked" type="button" class="btn btn--white btn--small" :disabled="isBusy" @click="unlock">
                Débloquer le profil
            </button>
            <button v-if="member.hasCode" type="button" class="btn btn--white btn--small" :disabled="isBusy" @click="removeCurrent">
                Retirer le code
            </button>
        </div>
        <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
    </section>
</template>

<script setup lang="ts">
const { member } = defineProps<{ member: IMember }>()

const { removeCode, unlockCode } = useMembers()

const isBusy = ref(false)
const errorMessage = ref('')

const stateLabel = computed(() => {
    if (member.isCodeLocked) {
        return 'Profil bloqué après trop d’essais.'
    }
    if (!member.hasCode) {
        return 'Aucun code défini.'
    }
    return member.codeKind === 'shapes' ? 'Code en formes défini.' : 'Code en chiffres défini.'
})

const run = async (action: () => Promise<void>): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        await action()
    } catch (error) {
        console.error('Le code n a pas pu être modifié', error)
        errorMessage.value = 'Impossible de modifier le code pour le moment.'
    } finally {
        isBusy.value = false
    }
}

const unlock = (): Promise<void> => run(() => unlockCode(member.id))

const removeCurrent = async (): Promise<void> => {
    if (!window.confirm(`Retirer le code de ${member.name} ?`)) {
        return
    }
    await run(() => removeCode(member.id))
}
</script>

<style scoped>
.code-admin {
    font-size: 1rem;
    overflow-wrap: anywhere;
}
</style>
