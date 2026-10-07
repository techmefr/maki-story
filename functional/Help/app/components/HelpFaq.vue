<template>
    <div class="stack help">
        <BackLink :to="backPath" />
        <h1 class="title">{{ t('help.title') }}</h1>
        <ul class="help__list">
            <li v-for="(item, index) in ITEMS" :key="item" class="help__item">
                <button
                    type="button"
                    class="help__question"
                    :aria-expanded="openIndex === index ? 'true' : 'false'"
                    :aria-controls="`help-answer-${index}`"
                    :data-testid="`help-question-${index}`"
                    @click="openIndex = openIndex === index ? -1 : index"
                >
                    <span class="grow">{{ t(`help.faq.${item}.q`) }}</span>
                    <AppIcon name="chevron-down" :size="22" class="help__chevron" :class="{ 'help__chevron--open': openIndex === index }" />
                </button>
                <p v-show="openIndex === index" :id="`help-answer-${index}`" class="help__answer">{{ t(`help.faq.${item}.a`) }}</p>
            </li>
        </ul>
        <section v-if="supportEmail" class="stack help__support" aria-labelledby="help-support">
            <h2 id="help-support" class="subtitle">{{ t('help.otherQuestion') }}</h2>
            <AppButton as="a" is-block icon="send" :href="`mailto:${supportEmail}`">{{ t('help.writeSupport') }}</AppButton>
        </section>
        <div class="row row--wrap">
            <AppButton variant="tertiary" size="sm" to="/legal">{{ t('help.legal') }}</AppButton>
            <AppButton variant="tertiary" size="sm" to="/account">{{ t('help.account') }}</AppButton>
        </div>
    </div>
</template>

<script setup lang="ts">
const ITEMS = ['addRelative', 'fiveMessages', 'recordVoice', 'forgotCode', 'favoriteVoice', 'otherLanguage']

const { t } = useI18n()
const { isRelativeAccount } = useSession()
const config = useRuntimeConfig()

const openIndex = ref(0)
const supportEmail = computed<string>(() => String(config.public.supportEmail ?? ''))
const backPath = computed<string>(() => (isRelativeAccount.value ? '/relative' : '/home'))
</script>

<style scoped>
.help__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 0;
    padding: 0;
    list-style: none;
}

.help__item {
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
    box-shadow: var(--shadow);
}

.help__question {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    min-height: var(--tap);
    padding: 14px 16px;
    border: 0;
    background: none;
    color: var(--ink);
    font: 700 1.0625rem/1.25 var(--font-title);
    text-align: start;
    cursor: pointer;
}

.help__chevron {
    flex: none;
    transition: rotate 0.2s;
}

.help__chevron--open {
    rotate: 180deg;
}

.help__answer {
    margin: 0;
    padding: 0 16px 16px;
    color: var(--ink-soft);
    font: 600 1rem/1.45 var(--font-body);
}

.help__support {
    padding: 16px;
    border: var(--outline) solid var(--ink);
    border-radius: 22px;
    background: var(--paper);
    box-shadow: var(--shadow);
}

@media (prefers-reduced-motion: reduce) {
    .help__chevron {
        transition: none;
    }
}
</style>
