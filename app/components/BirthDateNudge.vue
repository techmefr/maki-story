<template>
    <NuxtLink v-if="missing.length > 0" :to="`/family/${missing[0]?.id}`" class="card card--tap row" data-testid="birth-date-nudge" style="color: inherit; text-decoration: none">
        <AppIcon name="party" :size="30" motion="wiggle" />
        <span class="grow">
            <span class="subtitle">{{ t('library.birthNudge.title') }}</span>
            <span class="muted">{{ t('library.birthNudge.hint', { names: names }) }}</span>
        </span>
        <span class="badge">{{ t('library.birthNudge.action') }}</span>
    </NuxtLink>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { members } = useMembers()
const { isParent } = useCurrentMember()

const missing = computed(() => (isParent.value ? members.value.filter(member => member.role === 'child' && member.status === 'active' && !member.birthDate) : []))
const names = computed(() => missing.value.map(member => member.name).join(', '))
</script>
