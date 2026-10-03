import { fileURLToPath } from 'node:url'

export default defineNuxtConfig({
    css: [fileURLToPath(new URL('./app/assets/css/tokens.css', import.meta.url))],
})
