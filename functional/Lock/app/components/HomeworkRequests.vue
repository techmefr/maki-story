<template>
    <section v-if="items.length > 0" class="stack homework" aria-labelledby="homework-title" data-testid="homework-requests">
        <h2 id="homework-title" class="subtitle">{{ t('homework.requests.title') }}</h2>
        <ul class="homework__list">
            <li v-for="item in items" :key="item.id" class="homework__item" :data-testid="`homework-request-${item.id}`">
                <p class="homework__text">{{ t('homework.requests.text', { name: item.childName }) }}</p>
                <div class="row row--wrap">
                    <AppButton icon="check" :disabled="isBusy" :data-testid="`homework-approve-${item.id}`" @click="answer(item.id, 'approved')">
                        {{ t('homework.requests.approve') }}
                    </AppButton>
                    <AppButton variant="secondary" icon="close" :disabled="isBusy" :data-testid="`homework-refuse-${item.id}`" @click="answer(item.id, 'refused')">
                        {{ t('homework.requests.refuse') }}
                    </AppButton>
                </div>
            </li>
        </ul>
        <p v-if="hasFailed" class="error" role="alert">{{ t('homework.requests.failed') }}</p>
    </section>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { loadPending, decide } = useHomeworkGate()

const items = ref<IHomeworkRequest[]>([])
const isBusy = ref(false)
const hasFailed = ref(false)

const refresh = async (): Promise<void> => {
    try {
        items.value = await loadPending()
    } catch (_error) {
        items.value = []
    }
}

const answer = async (requestId: string, decision: THomeworkDecision): Promise<void> => {
    isBusy.value = true
    hasFailed.value = false
    try {
        await decide(requestId, decision)
    } catch (error) {
        hasFailed.value = (error as { statusCode?: number }).statusCode !== 409
    } finally {
        isBusy.value = false
    }
    await refresh()
}

onMounted(refresh)
</script>

<style scoped>
.homework__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.homework__item {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
    box-shadow: var(--shadow);
}

.homework__text {
    margin: 0;
    font: 700 1.0625rem/1.3 var(--font-title);
}
</style>
