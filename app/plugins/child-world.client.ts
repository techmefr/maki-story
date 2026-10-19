export default defineNuxtPlugin(() => {
    const { current } = useCurrentMember()
    watch(() => current.value?.role, role => document.documentElement.classList.toggle('child-world', role === 'child'), { immediate: true })
})
