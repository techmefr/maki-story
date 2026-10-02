<template>
    <section class="stack code-admin" aria-labelledby="code-admin-title" data-testid="code-admin">
        <h2 id="code-admin-title" class="subtitle">{{ t('parental.codeAdmin.title') }}</h2>
        <p class="muted" role="status" data-testid="code-state">{{ stateLabel }}</p>
        <div class="row row--wrap">
            <AppButton variant="secondary" size="sm" v-if="member.isCodeLocked" :disabled="isBusy" @click="unlock">
                {{ t('parental.codeAdmin.unlock') }}
            </AppButton>
            <AppButton variant="secondary" size="sm" v-if="member.hasCode" :disabled="isBusy" @click="removeCurrent">
                {{ t('parental.codeAdmin.remove') }}
            </AppButton>
        </div>
        <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
    </section>
</template>

<script setup lang="ts">
const { member } = defineProps<{ member: IMember }>()

const { t } = useI18n()
const { removeCode, unlockCode } = useMembers()

const isBusy = ref(false)
const errorMessage = ref('')

const stateLabel = computed(() => {
    if (member.isCodeLocked) {
        return t('parental.codeAdmin.locked')
    }
    if (!member.hasCode) {
        return t('parental.codeAdmin.none')
    }
    return member.codeKind === 'shapes' ? t('parental.codeAdmin.shapes') : t('parental.codeAdmin.digits')
})

const run = async (action: () => Promise<void>): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        await action()
    } catch (error) {
        console.error('Le code n a pas pu être modifié', error)
        errorMessage.value = t('parental.codeAdmin.failed')
    } finally {
        isBusy.value = false
    }
}

const unlock = (): Promise<void> => run(() => unlockCode(member.id))

const removeCurrent = async (): Promise<void> => {
    if (!window.confirm(t('parental.codeAdmin.removeConfirm', { name: member.name }))) {
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
