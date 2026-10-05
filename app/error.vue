<template>
    <ErrorState :type="type" />
</template>

<script setup lang="ts">
import type { TErrorStateType } from '~~/functional/Help/app/components/ErrorState.vue'

const HTTP_FORBIDDEN = 403
const HTTP_NOT_FOUND = 404
const HTTP_SERVER_ERROR = 500

const { error } = defineProps<{ error: { statusCode?: number } }>()

const type = computed<TErrorStateType>(() => {
    const code = error.statusCode ?? 0
    if (code === HTTP_FORBIDDEN) {
        return 'forbidden'
    }
    if (code === HTTP_NOT_FOUND) {
        return 'notFound'
    }
    return code >= HTTP_SERVER_ERROR ? 'server' : 'error'
})
</script>
