<template>
    <div class="gate" role="dialog" aria-modal="true" aria-labelledby="gate-title">
        <div class="gate__panel stack">
            <h2 id="gate-title" class="subtitle" tabindex="-1">{{ t('parental.gate.title') }}</h2>
            <template v-if="parents.length === 0">
                <p class="muted">{{ t('parental.gate.noParent') }}</p>
            </template>
            <template v-else>
                <div class="row row--wrap" role="group" :aria-label="t('parental.gate.which')">
                    <button
                        v-for="parent in parents"
                        :key="parent.id"
                        type="button"
                        class="chip"
                        :class="{ 'chip--on': parent.id === parentId }"
                        :aria-pressed="parent.id === parentId"
                        @click="parentId = parent.id"
                    >
                        {{ parent.name }}
                    </button>
                </div>
                <ShapePad v-if="selected?.codeKind === 'shapes'" :key="attempt" :is-disabled="isBusy" @submit="onCode" />
                <PinPad v-else :key="attempt" :is-disabled="isBusy" @submit="onCode" />
            </template>
            <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
            <button type="button" class="btn btn--white btn--small" @click="emit('cancel')">{{ t('common.cancel') }}</button>
        </div>
    </div>
</template>

<script setup lang="ts">
const { members, isBusy = false, errorMessage = '', attempt = 0 } = defineProps<{
    members: IMember[]
    isBusy?: boolean
    errorMessage?: string
    attempt?: number
}>()
const { t } = useI18n()
const emit = defineEmits<{ submit: [parentId: string, code: string]; cancel: [] }>()

const parents = computed(() => members.filter(member => member.role === 'parent' && member.status === 'active' && member.hasCode))
const parentId = ref(parents.value[0]?.id ?? '')
const selected = computed(() => parents.value.find(parent => parent.id === parentId.value) ?? null)

const onCode = (code: string): void => {
    if (parentId.value) {
        emit('submit', parentId.value, code)
    }
}
</script>

<style scoped>
.gate {
    position: fixed;
    inset: 0;
    z-index: 60;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: rgba(31, 27, 58, 0.55);
}

.gate__panel {
    width: min(100%, 420px);
    max-height: 100%;
    overflow-y: auto;
    padding: 20px;
    background: #fff4d9;
    border: 3px solid #1f1b3a;
    border-radius: 24px;
    box-shadow: 3px 3px 0 #1f1b3a;
}
</style>
