<template>
    <div class="stack narrow welcome" data-testid="welcome">
        <div class="row welcome__head">
            <AppMaki :size="56" class="anim-float" />
            <p class="muted" role="status" data-testid="welcome-progress">{{ t('welcome.progress', { current: stepNumber, total: STEPS.length }) }}</p>
        </div>
        <ol class="welcome__dots" aria-hidden="true">
            <li v-for="item in STEPS" :key="item" :class="{ 'welcome__dot--on': STEPS.indexOf(item) <= STEPS.indexOf(step) }" />
        </ol>
        <template v-if="step === 'code'">
            <h1 class="title" tabindex="-1">{{ t('welcome.code.title') }}</h1>
            <p class="muted">{{ t('welcome.code.hint') }}</p>
            <ProfileUnlock v-if="parent" :member="parent" :has-back="false" @unlocked="step = 'children'" />
            <AppEmpty v-else :title="t('welcome.loadingTitle')" />
        </template>
        <template v-else-if="step === 'children'">
            <h1 class="title" tabindex="-1">{{ t('welcome.children.title') }}</h1>
            <p class="muted">{{ t('welcome.children.hint') }}</p>
            <ul v-if="addedChildren.length > 0" class="stack welcome__list" data-testid="welcome-children">
                <li v-for="child in addedChildren" :key="child.id" class="card row">
                    <AppAvatar :member="child" :size="44" />
                    <span class="subtitle grow">{{ child.name }}</span>
                    <AppIcon name="check" :size="22" />
                </li>
            </ul>
            <WelcomeChildStep @saved="addedChildren = [...addedChildren, $event]" />
            <button type="button" class="btn btn--block welcome__action" :disabled="addedChildren.length === 0" data-testid="welcome-children-next" @click="step = 'invite'">
                <AppIcon name="next" :size="22" class="mirror-rtl" />{{ t('welcome.next') }}
            </button>
            <button type="button" class="btn btn--white btn--block welcome__action" data-testid="welcome-children-skip" @click="step = 'invite'">
                {{ t('welcome.skip') }}
            </button>
        </template>
        <template v-else-if="step === 'invite'">
            <h1 class="title" tabindex="-1">{{ t('welcome.invite.title') }}</h1>
            <p class="muted">{{ t('welcome.invite.hint') }}</p>
            <InviteForm @created="isInvited = true" />
            <button type="button" class="btn btn--block welcome__action" data-testid="welcome-invite-next" @click="step = 'done'">
                <AppIcon name="next" :size="22" class="mirror-rtl" />{{ isInvited ? t('welcome.next') : t('welcome.invite.later') }}
            </button>
        </template>
        <template v-else>
            <AppEmpty :title="t('welcome.done.title')" :hint="t('welcome.done.hint')" :size="120" />
            <button type="button" class="btn btn--block welcome__action" data-testid="welcome-finish" @click="finish">
                <AppIcon name="rocket" :size="22" motion="bounce" />{{ t('welcome.done.cta') }}
            </button>
        </template>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

type Step = 'code' | 'children' | 'invite' | 'done'
const STEPS: Step[] = ['code', 'children', 'invite', 'done']

const { t } = useI18n()
const { people, load } = useMembers()

const step = ref<Step>('code')
const addedChildren = ref<IMember[]>([])
const isInvited = ref(false)

const stepNumber = computed(() => STEPS.indexOf(step.value) + 1)
const parent = computed(() => people.value.find(member => member.role === 'parent') ?? null)

const finish = async (): Promise<void> => {
    await navigateTo('/home')
}

onMounted(load)
</script>

<style scoped>
.welcome__head {
    justify-content: space-between;
}

.welcome__dots {
    display: flex;
    gap: 8px;
    list-style: none;
    margin: 0;
    padding: 0;
}

.welcome__dots li {
    flex: 1;
    height: 10px;
    border: 2px solid var(--ink);
    border-radius: 999px;
    background: var(--cream);
    transition: background 0.3s;
}

.welcome__dots li.welcome__dot--on {
    background: var(--sun);
}

.welcome__list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.welcome__action {
    min-height: 56px;
}

@media (prefers-reduced-motion: reduce) {
    .welcome__dots li {
        transition: none;
    }
}
</style>
