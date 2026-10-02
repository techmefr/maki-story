<template>
    <div class="stack">
        <h1 class="title">{{ t('family.index.title') }}</h1>
        <div class="grid grid--people">
        <NuxtLink
            v-for="(member, index) in people"
            :key="member.id"
            :to="`/family/${member.id}`"
            class="card card--tap row pop-in"
            :style="{ '--i': index }"
            style="color: inherit; text-decoration: none"
        >
            <AppAvatar :member="member" :size="56" />
            <div class="grow">
                <div class="subtitle">{{ member.name }}</div>
                <div class="muted">{{ roleLabel(member.role) }}{{ statusSuffix(member) }}</div>
            </div>
            <span class="badge">{{ t('family.index.edit') }}</span>
        </NuxtLink>
        </div>
        <template v-if="guests.length > 0">
            <h2 class="subtitle">{{ t('family.index.guestVoices') }}</h2>
            <p class="muted">{{ t('family.index.guestHint') }}</p>
            <NuxtLink v-for="member in guests" :key="member.id" :to="`/family/${member.id}`" class="card card--tap row" style="color: inherit; text-decoration: none">
                <AppAvatar :member="member" :size="48" />
                <div class="grow">
                    <div class="subtitle">{{ member.name }}</div>
                    <div class="muted">{{ t('family.index.guestVoice') }}{{ statusSuffix(member) }}</div>
                </div>
                <span class="badge">{{ t('family.index.manage') }}</span>
            </NuxtLink>
        </template>
        <NuxtLink to="/family/add" class="btn btn--block"><AppIcon name="user-plus" :size="22" />{{ t('family.index.add') }}</NuxtLink>
        <NuxtLink to="/storage" class="btn btn--white btn--block"><AppIcon name="download" :size="22" />{{ t('family.index.storage') }}</NuxtLink>
        <NuxtLink to="/sharing" class="btn btn--white btn--block"><AppIcon name="send" :size="22" />{{ t('family.index.sharing') }}</NuxtLink>
        <NuxtLink to="/family/devices" class="btn btn--white btn--block">{{ t('family.index.devices') }}</NuxtLink>
        <NuxtLink to="/family/activity" class="btn btn--white btn--block"><AppIcon name="eye" :size="22" />{{ t('recovery.links.activity') }}</NuxtLink>
        <NuxtLink to="/family/trash" class="btn btn--white btn--block"><AppIcon name="trash" :size="22" />{{ t('recovery.links.trash') }}</NuxtLink>
        <NuxtLink to="/family/data" class="btn btn--white btn--block"><AppIcon name="download" :size="22" />{{ t('recovery.links.data') }}</NuxtLink>
        <NuxtLink to="/feedback" class="btn btn--white btn--block">{{ t('family.index.feedback') }}</NuxtLink>
    </div>
</template>

<script setup lang="ts">
const { people, guests } = useMembers()

const { t } = useI18n()

const statusSuffix = (member: IMember): string => {
    if (member.status === 'blocked' || member.status === 'left' || member.status === 'deceased') {
        return ` · ${t(`family.status.${member.status}`)}`
    }
    return ''
}
</script>
