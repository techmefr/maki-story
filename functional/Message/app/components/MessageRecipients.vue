<template>
    <div class="recipients" role="group" :aria-label="t('messages.compose.recipients')" data-testid="message-recipients">
        <AppChip
            v-for="item in recipients"
            :key="item.member.id"
            class="recipient"
            :selected="item.member.id === modelValue"
            :data-testid="`message-recipient-${item.member.id}`"
            @click="emit('update:modelValue', item.member.id)"
        >
            <AppAvatar :member="item.member" :size="50" />
            <span class="recipient__name">{{ item.member.name }}</span>
            <MessageQuota :quota="item.quota" />
        </AppChip>
    </div>
</template>

<script setup lang="ts">
defineProps<{ recipients: IMessageRecipient[]; modelValue: string | null }>()
const emit = defineEmits<{ 'update:modelValue': [id: string] }>()

const { t } = useI18n()
</script>

<style scoped>
.recipients {
    display: flex;
    gap: 10px;
    overflow-x: auto;
    padding: 2px 4px 10px;
}

.recipient {
    flex: none;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 104px;
    padding: 10px 6px;
    border-width: var(--outline);
    border-radius: 22px;
    background: var(--paper);
    color: var(--ink);
}

.recipient.chip--on {
    background: var(--yellow);
    color: var(--on-accent);
    box-shadow: var(--shadow);
}

.recipient__name {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: 700 1rem/1.2 var(--font-title);
}
</style>
