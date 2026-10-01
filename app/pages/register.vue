<template>
    <div class="stack center narrow" style="margin-top: 6vh">
        <AppLogo :size="110" class="anim-float" />
        <h1 class="title">Créer ma famille</h1>
        <p class="muted">Un compte, une famille, votre premier profil de parent.</p>
        <form class="card stack" style="width: 100%; text-align: left" @submit.prevent="submit">
            <label class="stack" style="gap: 6px">
                <span class="label">E-mail</span>
                <input
                    v-model="email"
                    class="input"
                    type="email"
                    inputmode="email"
                    autocomplete="email"
                    autocapitalize="off"
                    autocorrect="off"
                    spellcheck="false"
                    required
                />
            </label>
            <label class="stack" style="gap: 6px">
                <span class="label">Mot de passe (8 caractères minimum)</span>
                <input
                    v-model="password"
                    class="input"
                    type="password"
                    autocomplete="new-password"
                    autocapitalize="off"
                    autocorrect="off"
                    spellcheck="false"
                    minlength="8"
                    required
                />
            </label>
            <label class="stack" style="gap: 6px">
                <span class="label">Nom de la famille</span>
                <input v-model="familyName" class="input" type="text" placeholder="Les Martin" required />
            </label>
            <label class="stack" style="gap: 6px">
                <span class="label">Votre prénom</span>
                <input v-model="parentName" class="input" type="text" placeholder="Maman, Papa…" required />
            </label>
            <div v-if="errorMessage" class="error" role="alert">{{ errorMessage }}</div>
            <button type="submit" class="btn btn--block" :disabled="isBusy">
                {{ isBusy ? 'Création…' : 'Créer mon compte' }}
            </button>
        </form>
        <NuxtLink to="/login" class="btn btn--white btn--block">J’ai déjà un compte</NuxtLink>
    </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'blank' })

const { register } = useSession()

const email = ref('')
const password = ref('')
const familyName = ref('')
const parentName = ref('')
const isBusy = ref(false)
const errorMessage = ref('')

const submit = async (): Promise<void> => {
    errorMessage.value = ''
    isBusy.value = true
    const result = await register({
        email: email.value.trim(),
        password: password.value,
        familyName: familyName.value,
        parentName: parentName.value,
    })
    isBusy.value = false
    if (result.status === 'unreachable') {
        errorMessage.value = 'Impossible de joindre le serveur. Vérifie ta connexion et réessaie.'
        return
    }
    if (result.status !== 'ok') {
        errorMessage.value = 'Impossible de créer le compte : vérifiez les champs, ou cet e-mail est déjà utilisé.'
        return
    }
    await navigateTo('/profiles')
}
</script>
