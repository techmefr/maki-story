<template>
    <div class="stack access">
        <div class="row">
            <BackLink to="/family" />
            <h1 class="title grow">{{ t('bookAccess.title') }}</h1>
        </div>
        <AppEmpty v-if="children.length === 0" :title="t('lock.noChildTitle')" :hint="t('lock.noChildHint')" />
        <template v-else>
            <div class="row row--wrap" role="tablist" :aria-label="t('lock.children')">
                <AppChip
                    v-for="child in children"
                    :key="child.id"
                    role="tab"
                    :selected="child.id === selectedId"
                    :aria-selected="child.id === selectedId ? 'true' : 'false'"
                    @click="select(child.id)"
                >
                    <AppAvatar :member="child" :size="28" />{{ child.name }}
                </AppChip>
            </div>
            <template v-if="current">
                <AppToggle :model-value="!current.isRestricted" data-testid="access-all" @update:model-value="toggleAll">
                    <span class="access__text">
                        <span class="access__title">{{ t('bookAccess.all') }}</span>
                        <span class="access__hint">{{ current.isRestricted ? t('bookAccess.restrictedHint') : t('bookAccess.allHint') }}</span>
                    </span>
                </AppToggle>
                <AppEmpty v-if="readyBooks.length === 0" :title="t('bookAccess.emptyTitle')" :hint="t('bookAccess.emptyHint')" />
                <ul class="access__list" :class="{ 'access__list--off': !current.isRestricted }">
                    <li v-for="book in readyBooks" :key="book.id">
                        <AppCheckbox
                            :model-value="!current.isRestricted || current.bookIds.includes(book.id)"
                            :disabled="!current.isRestricted"
                            :data-testid="`access-book-${book.id}`"
                            @update:model-value="toggleBook(book.id)"
                        >
                            {{ book.title }}
                        </AppCheckbox>
                    </li>
                </ul>
                <p v-if="hasFailed" class="error" role="alert">{{ t('lock.failed') }}</p>
            </template>
        </template>
    </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const { children, readyBooks, selectedId, current, hasFailed, init, select, toggleAll, toggleBook } = useBookAccess()

onMounted(init)
</script>

<style scoped>
.access__text {
    display: flex;
    flex-direction: column;
}

.access__title {
    font: 700 1.0625rem/1.2 var(--font-title);
}

.access__hint {
    color: var(--ink-soft);
    font: 600 0.875rem/1.3 var(--font-body);
}

.access__list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.access__list--off {
    opacity: 0.55;
}
</style>
