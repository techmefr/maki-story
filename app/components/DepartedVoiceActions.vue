<template>
    <section v-if="isDeparted" class="card stack" aria-labelledby="departed-voice-title" data-testid="departed-voice">
        <h2 id="departed-voice-title" class="subtitle">{{ t('recovery.voice.title') }}</h2>
        <p class="muted">{{ t('recovery.voice.hint') }}</p>
        <AppButton variant="secondary" size="sm" as="a" :href="`${apiBase}/api/members/${memberId}/voice-export`" download>
            <AppIcon name="download" :size="18" />{{ t('recovery.voice.export') }}
        </AppButton>
        <template v-if="isConfirming">
            <p class="error" role="alert">{{ t('recovery.voice.confirm') }}</p>
            <div class="row row--wrap">
                <AppButton variant="destructive" size="sm" :disabled="isBusy" @click="removeVoice">
                    <AppIcon name="trash" :size="18" />{{ t('recovery.voice.confirmAction') }}
                </AppButton>
                <AppButton variant="secondary" size="sm" @click="isConfirming = false">{{ t('common.cancel') }}</AppButton>
            </div>
        </template>
        <AppButton variant="secondary" size="sm" v-else @click="isConfirming = true">
            <AppIcon name="trash" :size="18" />{{ t('recovery.voice.delete') }}
        </AppButton>
        <p v-if="message" class="muted" role="status">{{ message }}</p>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </section>
</template>

<script setup lang="ts">
const { memberId } = defineProps<{ memberId: string }>()

const { t } = useI18n()
const config = useRuntimeConfig()
const { request } = useApi()
const { getById } = useMembers()

const apiBase = config.public.apiBase
const isConfirming = ref(false)
const isBusy = ref(false)
const message = ref('')
const errorMessage = ref('')

const member = computed(() => getById(memberId))
const isDeparted = computed(() => member.value?.status === 'left' || member.value?.status === 'deceased')

const removeVoice = async (): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        const result = await request<{ deleted: number }>(`/members/${memberId}/voice-delete`, { method: 'POST' })
        message.value = t('recovery.voice.deleted', { count: result.deleted })
        isConfirming.value = false
    } catch (_error) {
        errorMessage.value = t('recovery.voice.error')
    } finally {
        isBusy.value = false
    }
}
</script>
