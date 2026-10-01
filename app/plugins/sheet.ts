const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

type TSheetState = { onKeydown: (event: KeyboardEvent) => void; previous: Element | null }
type TSheetElement = HTMLElement & { __sheet?: TSheetState }

export default defineNuxtPlugin(nuxtApp => {
    nuxtApp.vueApp.directive<TSheetElement, (() => void) | undefined>('sheet', {
        mounted(element, binding) {
            const previous = document.activeElement
            const focusables = (): HTMLElement[] => Array.from(element.querySelectorAll<HTMLElement>(FOCUSABLE))
            const onKeydown = (event: KeyboardEvent): void => {
                if (event.key === 'Escape') {
                    event.stopPropagation()
                    binding.value?.()
                    return
                }
                if (event.key !== 'Tab') {
                    return
                }
                const items = focusables()
                const first = items[0]
                const last = items[items.length - 1]
                if (!first || !last) {
                    return
                }
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault()
                    last.focus()
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault()
                    first.focus()
                }
            }
            element.__sheet = { onKeydown, previous }
            element.addEventListener('keydown', onKeydown)
            if (!element.contains(document.activeElement)) {
                const target = element.querySelector<HTMLElement>('[data-focus-default]') ?? focusables()[0] ?? element
                if (target === element) {
                    element.tabIndex = -1
                }
                target.focus()
            }
        },
        unmounted(element) {
            const state = element.__sheet
            if (!state) {
                return
            }
            element.removeEventListener('keydown', state.onKeydown)
            if (state.previous instanceof HTMLElement && document.contains(state.previous)) {
                state.previous.focus()
            }
        },
        getSSRProps: () => ({}),
    })
})
