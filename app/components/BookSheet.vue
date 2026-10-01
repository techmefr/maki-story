<template>
    <div class="sheet-backdrop" @click.self="emit('close')">
        <div ref="panel" class="sheet stack" role="dialog" aria-modal="true" :aria-label="`Fiche de ${book.title}`" @keydown.esc.prevent="emit('close')">
            <h2 class="title">{{ book.title }}</h2>
            <p v-if="book.subtitle" class="subtitle">{{ book.subtitle }}</p>
            <dl class="sheet__facts">
                <div v-if="book.author">
                    <dt>Auteur</dt>
                    <dd>{{ book.author }}</dd>
                </div>
                <div v-if="book.illustrator">
                    <dt>Dessinateur</dt>
                    <dd>{{ book.illustrator }}</dd>
                </div>
                <div v-if="ageLabel">
                    <dt>Âge</dt>
                    <dd><span class="badge">{{ ageLabel }}</span></dd>
                </div>
                <div>
                    <dt>Langue</dt>
                    <dd>{{ languageLabel(book.language) }}</dd>
                </div>
            </dl>
            <section class="stack" style="gap: 8px" aria-labelledby="book-readers">
                <h3 id="book-readers" class="label">Lu par</h3>
                <ul v-if="readers.length > 0" class="readers">
                    <li v-for="reader in readers" :key="reader.id" class="row readers__item">
                        <AppAvatar :member="reader" :size="40" />
                        <span class="subtitle" :style="{ borderBottom: `4px solid ${memberHex(reader)}` }">{{ reader.name }}</span>
                    </li>
                </ul>
                <p v-else class="muted">Personne n’a encore enregistré sa voix.</p>
            </section>
            <NuxtLink v-if="target" :to="target.path" class="btn btn--block" data-focus-default @click="emit('close')">
                <AppIcon :name="target.icon" :size="22" />{{ target.label }}
            </NuxtLink>
            <button type="button" class="btn btn--white btn--block" @click="emit('close')">Fermer</button>
        </div>
    </div>
</template>

<script setup lang="ts">
const { book } = defineProps<{ book: IBookSummary }>()
const emit = defineEmits<{ close: [] }>()

const { getById } = useMembers()
const { isChild } = useCurrentMember()
const panel = ref<HTMLElement | null>(null)

const readers = computed(() => book.readerIds.map(id => getById(id)).filter((member): member is IMember => member !== null))
const ageLabel = computed(() => ageLabelOf(book.ageMin, book.ageMax))
const target = computed((): { path: string; label: string; icon: IconName } => {
    if (isChild.value) {
        return { path: `/kid/listen/${book.id}`, label: 'Écouter', icon: 'play' }
    }
    return book.status === 'ready'
        ? { path: `/books/${book.id}/play`, label: 'Ouvrir le livre', icon: 'play' }
        : { path: `/books/${book.id}/studio`, label: 'Aller au studio', icon: 'mic' }
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
    font: 700 14px/1 var(--font-title);
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
