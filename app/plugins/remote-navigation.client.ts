const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
const TEXT_FIELDS = ['INPUT', 'TEXTAREA', 'SELECT']
const REMOTE_AREAS = [/^\/kid(\/|$)/, /^\/message\/listen\//]
const BACK_KEYS = ['Escape', 'GoBack', 'BrowserBack', 'XF86Back']
const ARROWS: Record<string, SpatialDirection> = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
}

const isVisible = (element: HTMLElement): boolean => {
    const box = element.getBoundingClientRect()
    return box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== 'hidden'
}

const focusables = (): HTMLElement[] => {
    const modal = document.querySelector<HTMLElement>('.sheet-backdrop, [role="dialog"]')
    const root = modal ?? document.body
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isVisible)
}

const focusFirst = (): void => {
    const target = document.querySelector<HTMLElement>('[data-focus-default]') ?? focusables()[0]
    target?.focus()
}

export default defineNuxtPlugin(nuxtApp => {
    const router = useRouter()
    let isRemote = false

    const isActive = (): boolean => REMOTE_AREAS.some(pattern => pattern.test(router.currentRoute.value.path))

    const goBack = (): void => {
        if (document.querySelector('.sheet-backdrop, [role="dialog"]')) {
            return
        }
        if (window.history.length > 1) {
            router.back()
            return
        }
        void navigateTo('/kid')
    }

    window.addEventListener('keydown', event => {
        if (!isActive() || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
            return
        }
        const target = event.target as HTMLElement | null
        if (target && TEXT_FIELDS.includes(target.tagName)) {
            return
        }
        const direction = ARROWS[event.key]
        if (direction) {
            isRemote = true
            document.documentElement.classList.add('remote')
            const items = focusables()
            const active = document.activeElement as HTMLElement | null
            const currentIndex = active ? items.indexOf(active) : -1
            if (currentIndex === -1) {
                focusFirst()
                event.preventDefault()
                return
            }
            const next = pickSpatialTarget(
                items.map(item => item.getBoundingClientRect()),
                currentIndex,
                direction,
            )
            if (next !== -1) {
                event.preventDefault()
                items[next]?.focus()
                items[next]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
            }
            return
        }
        if (BACK_KEYS.includes(event.key) || event.keyCode === 4) {
            event.preventDefault()
            goBack()
            return
        }
        if (event.key === 'Enter' && target && target.getAttribute('role') === 'button' && target.tagName !== 'BUTTON') {
            event.preventDefault()
            target.click()
        }
    })

    window.addEventListener('pointerdown', () => {
        isRemote = false
        document.documentElement.classList.remove('remote')
    })

    nuxtApp.hook('page:finish', () => {
        if (isRemote && isActive()) {
            requestAnimationFrame(focusFirst)
        }
    })
})
