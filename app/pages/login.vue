<template>
    <div class="stack center narrow" style="margin-top: 6vh">
        <AppLogo :size="110" class="anim-float" />
        <h1 class="title">Tantara</h1>
        <p class="muted">Les livres de la maison, lus par toute la famille.</p>
        <form class="card stack" style="width: 100%; text-align: left" @submit.prevent="submit">
            <label class="stack" style="gap: 6px">
                <span class="label">E-mail</span>
                <input
                    v-model="email"
                    class="input"
                    type="email"
                    inputmode="email"
                    autocomplete="username"
                    autocapitalize="off"
                    autocorrect="off"
                    spellcheck="false"
                    required
                />
            </label>
            <label class="stack" style="gap: 6px">
                <span class="label">Mot de passe</span>
                <div class="row">
                    <input
                        v-model="password"
                        class="input grow"
                        :type="isVisible ? 'text' : 'password'"
                        autocomplete="current-password"
                        autocapitalize="off"
                        autocorrect="off"
                        spellcheck="false"
                        required
                    />
                    <button type="button" class="btn btn--small btn--white" @click="isVisible = !isVisible">
                        {{ isVisible ? 'Cacher' : 'Voir' }}
                    </button>
                </div>
            </label>
            <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
            <button type="submit" class="btn btn--block" :disabled="isBusy">
                {{ isBusy ? 'Connexion…' : 'Se connecter' }}
            </button>
        </form>
        <NuxtLink to="/register" class="btn btn--white btn--block">Créer un compte famille</NuxtLink>
        <SocialSignIn />
        <div class="dots" style="justify-content: center">
            <span v-for="color in colors" :key="color.id" class="dot" :style="{ background: color.hex }" />
        </div>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const colors = VOICE_COLORS
const { login } = useSession()

const email = ref('')
const password = ref('')
const isVisible = ref(false)
const isBusy = ref(false)
const route = useRoute()
const SOCIAL_ERRORS: Record<string, string> = {
    email_unverified: 'Ce compte n’a pas d’e-mail vérifié. Connecte-toi avec ton e-mail et ton mot de passe.',
    oauth_state: 'La connexion a expiré. Réessaie.',
    oauth_denied: 'La connexion a été annulée.',
    oauth_failed: 'La connexion avec ce compte a échoué. Réessaie.',
}
const errorMessage = ref(SOCIAL_ERRORS[String(route.query.error ?? '')] ?? '')

const loginMessage = (result: TAuthResult): string => {
    if (result.status === 'throttled') {
        const unit = result.retryAfterMinutes > 1 ? 'minutes' : 'minute'
        return `Trop d’essais, réessaie dans ${result.retryAfterMinutes} ${unit}.`
    }
    if (result.status === 'unreachable') {
        return 'Impossible de joindre le serveur. Vérifie ta connexion et réessaie.'
    }
    if (result.status === 'error') {
        return 'Le serveur a rencontré un problème. Réessaie dans un instant.'
    }
    return 'E-mail ou mot de passe incorrect.'
}

const submit = async (): Promise<void> => {
    errorMessage.value = ''
    isBusy.value = true
    const result = await login(email.value.trim(), password.value)
    isBusy.value = false
    if (result.status !== 'ok') {
        errorMessage.value = loginMessage(result)
        return
    }
    await navigateTo('/profiles')
}
</script>
