<template>
    <div class="sheet-backdrop" @click.self="emit('close')">
        <div ref="panel" class="sheet stack" role="dialog" aria-modal="true" :aria-label="t('books.sheet.title', { title: book.title })" @keydown.esc.prevent="emit('close')">
            <h2 class="title">{{ book.title }}</h2>
            <p v-if="book.subtitle" class="subtitle">{{ book.subtitle }}</p>
            <p v-if="book.isVoiceBlocked && !isChild"><span class="badge" style="background: #ff7a6b">{{ t('books.sheet.voiceBlocked') }}</span></p>
            <dl class="sheet__facts">
                <div v-if="book.author">
                    <dt>{{ t('books.sheet.author') }}</dt>
                    <dd>{{ book.author }}</dd>
                </div>
                <div v-if="book.illustrator">
                    <dt>{{ t('books.sheet.illustrator') }}</dt>
                    <dd>{{ book.illustrator }}</dd>
                </div>
                <div v-if="ageLabel">
                    <dt>{{ t('books.sheet.age') }}</dt>
                    <dd><span class="badge">{{ ageLabel }}</span></dd>
                </div>
                <div>
                    <dt>{{ t('books.sheet.language') }}</dt>
                    <dd>{{ languageLabel(book.language) }}</dd>
                </div>
            </dl>
            <section class="stack" style="gap: 8px" aria-labelledby="book-readers">
                <h3 id="book-readers" class="label">{{ t('books.sheet.readBy') }}</h3>
                <ul v-if="readers.length > 0" class="readers">
                    <li v-for="reader in readers" :key="reader.id" class="row readers__item">
                        <AppAvatar :member="reader" :size="40" />
                        <span class="subtitle" :style="{ borderBottom: `4px solid ${memberHex(reader)}` }">{{ reader.name }}</span>
                    </li>
                </ul>
                <p v-else class="muted">{{ t('books.sheet.nobody') }}</p>
            </section>
            <AppButton is-block v-if="target" :to="target.path" data-focus-default @click="emit('close')">
                <AppIcon :name="target.icon" :size="22" />{{ target.label }}
            </AppButton>
            <AppButton variant="secondary" is-block v-if="canShare" @click="emit('share', book)">{{ t('books.sheet.share') }}</AppButton>
            <AppButton variant="secondary" is-block @click="emit('close')">{{ t('common.close') }}</AppButton>
        </div>
    </div>
</template>

<script setup lang="ts">
const { book } = defineProps<{ book: IBookSummary }>()
const emit = defineEmits<{ close: []; share: [book: IBookSummary] }>()

const { t } = useI18n()
const { getById } = useMembers()
const { isChild, current } = useCurrentMember()
const isOnline = useState<boolean>('is-online', () => true)
const panel = ref<HTMLElement | null>(null)
const isParent = computed(() => current.value?.role === 'parent')

const readers = computed(() => book.readerIds.map(id => getById(id)).filter((member): member is IMember => member !== null))
const canShare = computed(() => {
    if (!isOnline.value || !current.value) {
        return false
    }
    if (current.value.role === 'parent') {
        return true
    }
    return current.value.role === 'relative' && book.kind === 'solo' && book.soloMemberId === current.value.id
})
const ageLabel = computed(() => {
    if (book.ageMin === null) {
        return ''
    }
    if (book.ageMax === null || book.ageMax === book.ageMin) {
        return t('books.age.years', { count: book.ageMin })
    }
    return t('books.age.range', { min: book.ageMin, max: book.ageMax, count: book.ageMax })
})
const target = computed((): { path: string; label: string; icon: IconName } => {
    if (isChild.value) {
        return { path: `/kid/listen/${book.id}`, label: t('books.sheet.listen'), icon: 'play' }
    }
    if (isParent.value && book.submittedCount > 0) {
        return { path: `/books/${book.id}/review`, label: t('review.sheetReview'), icon: 'check' }
    }
    return book.status === 'ready'
        ? { path: `/books/${book.id}/play`, label: t('books.sheet.open'), icon: 'play' }
        : { path: `/books/${book.id}/studio`, label: t('books.sheet.studio'), icon: 'mic' }
})

onMounted(() => {
    const first = panel.value?.querySelector<HTMLElement>('[data-focus-default], button')
    first?.focus()
})
</script>

<style scoped>
.sheet__facts {
    margin: 0;
    display: grid;
    gap: 6px;
}

.sheet__facts div {
    display: flex;
    gap: 10px;
    align-items: center;
}

.sheet__facts dt {
    font: 700 0.875rem/1 var(--font-title);
    min-width: 70px;
}

.sheet__facts dd {
    margin: 0;
}

.readers {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
}
</style>
