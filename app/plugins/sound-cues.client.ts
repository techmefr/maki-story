const CUE_ATTRIBUTE = 'data-sound'

const isCue = (value: string | null): value is SoundCue => SOUND_CUES.includes(value as SoundCue)

export default defineNuxtPlugin(nuxtApp => {
    const cues = useSoundCues()

    const applyCue = (element: HTMLElement, value: SoundCue | 'none'): void => element.setAttribute(CUE_ATTRIBUTE, value)

    nuxtApp.vueApp.directive('sound', {
        mounted: (element: HTMLElement, binding: { value: SoundCue | 'none' }) => applyCue(element, binding.value),
        updated: (element: HTMLElement, binding: { value: SoundCue | 'none' }) => applyCue(element, binding.value),
    })

    document.addEventListener('pointerdown', () => cues.unlock(), { once: true, capture: true })

    document.addEventListener(
        'click',
        event => {
            const target = (event.target as Element | null)?.closest('button, a[href], [data-sound]')
            if (!target || (target as HTMLButtonElement).disabled) {
                return
            }
            const explicit = target.closest(`[${CUE_ATTRIBUTE}]`)?.getAttribute(CUE_ATTRIBUTE) ?? null
            if (explicit === 'none') {
                return
            }
            if (isCue(explicit)) {
                cues.play(explicit)
                return
            }
            cues.play(target.tagName === 'A' ? 'navigation' : 'button')
        },
        { capture: true },
    )
})
