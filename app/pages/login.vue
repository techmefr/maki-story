<template>
    <div class="stack center narrow" style="margin-top: 6vh">
        <AppMaki :size="110" class="anim-float" />
        <h1 class="title">Tantara</h1>
        <p class="muted">Les livres de la maison, lus par toute la famille.</p>
        <form class="card stack" style="width: 100%; text-align: left" @submit.prevent="submit">
            <label class="stack" style="gap: 6px">
                <span class="label">E-mail</span>
                <input v-model="email" class="input" type="email" autocomplete="email" required />
            </label>
            <label class="stack" style="gap: 6px">
                <span class="label">Mot de passe</span>
                <div class="row">
                    <input
                        v-model="password"
                        class="input grow"
                        :type="isVisible ? 'text' : 'password'"
                        autocomplete="current-password"
                        required
                    />
                    <button type="button" class="btn btn--small btn--white" @click="isVisible = !isVisible">
                        {{ isVisible ? 'Cacher' : 'Voir' }}
                    </button>
                </div>
            </label>
            <div v-if="errorMessage" class="error">{{ errorMessage }}</div>
            <button type="submit" class="btn btn--block" :disabled="isBusy">
                {{ isBusy ? 'Connexion…' : 'Se connecter' }}
            </button>
        </form>
        <NuxtLink to="/register" class="btn btn--white btn--block">Créer un compte famille</NuxtLink>
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
const errorMessage = ref('')

const submit = async (): Promise<void> => {
    errorMessage.value = ''
    isBusy.value = true
    const isOk = await login(email.value, password.value)
    isBusy.value = false
    if (!isOk) {
        errorMessage.value = 'E-mail ou mot de passe incorrect.'
        return
    }
    await navigateTo('/profiles')
}
</script>
