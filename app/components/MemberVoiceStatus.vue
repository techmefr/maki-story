<template>
    <section v-if="member" class="card stack" aria-labelledby="voice-status-title">
        <h2 id="voice-status-title" class="subtitle">{{ t('member.voice.title') }}</h2>
        <div class="row row--wrap" role="group" :aria-label="t('member.voice.group')">
            <button
                v-for="option in statuses"
                :key="option.value"
                type="button"
                class="chip"
                :class="{ 'chip--on': member.status === option.value }"
                :aria-pressed="member.status === option.value"
                :disabled="isBusy"
                @click="setStatus(option.value)"
            >
                {{ option.label }}
            </button>
        </div>
        <fieldset v-if="isHousehold" class="stack fieldset">
            <legend class="label">{{ t('member.voice.policyQuestion') }}</legend>
            <label v-for="option in policies" :key="option.value" class="row">
                <input
                    type="radio"
                    name="voice-policy"
                    :value="option.value"
                    :checked="member.voicePolicy === option.value"
                    :disabled="isBusy"
                    @change="setPolicy(option.value)"
                />
                <span>{{ option.label }}</span>
            </label>
        </fieldset>
        <p v-if="isBlocked" class="muted" role="status">{{ t('member.voice.blockedNotice') }}</p>
        <ul v-if="books.length > 0" class="list stack">
            <li v-for="book in books" :key="book.id" class="row">
                <span class="grow">{{ book.title }} · {{ t('member.voice.lines', { count: book.lineCount }) }}</span>
                <NuxtLink v-if="isBlocked" :to="`/books/${book.id}/studio`" class="btn btn--white btn--small">{{ t('member.voice.rerecordAction') }}</NuxtLink>
            </li>
        </ul>
        <p v-else class="muted">{{ t('member.voice.empty') }}</p>
        <p v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</p>
    </section>
</template>

<script setup lang="ts">
const { memberId } = defineProps<{ memberId: string }>()

const { t } = useI18n()

const statuses = computed<{ value: MemberStatus; label: string }[]>(() => [
    { value: 'active', label: t('member.voice.active') },
    { value: 'blocked', label: t('member.voice.blocked') },
    { value: 'left', label: t('member.voice.left') },
    { value: 'deceased', label: t('member.voice.deceased') },
])
const policies = computed<{ value: VoicePolicy; label: string }[]>(() => [
    { value: 'keep', label: t('member.voice.keep') },
    { value: 'block', label: t('member.voice.block') },
    { value: 'rerecord', label: t('member.voice.rerecord') },
])

const { request } = useApi()
const { getById, update } = useMembers()
const { load: reloadBooks } = useBooks()

const books = ref<IVoiceBook[]>([])
const isBusy = ref(false)
const errorMessage = ref('')

const member = computed(() => getById(memberId))
const isHousehold = computed(() => member.value?.status === 'left' || member.value?.status === 'deceased')
const isBlocked = computed(() => (member.value ? isVoiceBlocked(member.value.status, member.value.voicePolicy) : false))

const loadBooks = async (): Promise<void> => {
    try {
        books.value = await request<IVoiceBook[]>(`/members/${memberId}/voice-books`)
    } catch (_error) {
        books.value = []
    }
}

const save = async (patch: Partial<IMember>): Promise<void> => {
    isBusy.value = true
    errorMessage.value = ''
    try {
        await update(memberId, patch)
        await reloadBooks()
    } catch (_error) {
        errorMessage.value = t('member.voice.saveError')
    } finally {
        isBusy.value = false
    }
}

const setStatus = (status: MemberStatus): Promise<void> => save({ status })
const setPolicy = (voicePolicy: VoicePolicy): Promise<void> => save({ voicePolicy })

onMounted(loadBooks)
</script>

<style scoped>
.fieldset {
    border: 0;
    padding: 0;
    margin: 0;
}

.list {
    list-style: none;
    padding: 0;
    margin: 0;
}
</style>
