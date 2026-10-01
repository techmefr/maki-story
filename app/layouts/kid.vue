<template>
    <div class="kid">
        <a class="skip-link" href="#main">Aller au contenu</a>
        <div class="app app--full">
            <AppHeader />
            <main id="main" tabindex="-1">
                <slot />
            </main>
        </div>
        <ProfileMenu />
        <ProfileSwitcher />
    </div>
</template>
