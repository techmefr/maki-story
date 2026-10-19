const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
const TEXT_FIELDS = ['INPUT', 'TEXTAREA', 'SELECT']
const KID_AREAS = [/^\/kid(\/|$)/, /^\/message\/listen\//]
const BACK_KEYS = ['GoBack', 'BrowserBack', 'XF86Back']
const OWN_ARROW_ROLES = ['slider', 'radio', 'tab', 'menuitem', 'option', 'combobox', 'listbox']
const ARROWS: Record<string, SpatialDirection> = {
    ArrowLeft: 'left',
    ArrowRight: 'right',
    ArrowUp: 'up',
    ArrowDown: 'down',
}

const isVisible = (element: HTMLElement): boolean => {
    const box = element.getBoundingClientRect()
    return box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== 'hidden' && !element.closest('[inert], [aria-hidden="true"]') && !element.matches(':disabled, [aria-disabled="true"]')
}

const focusables = (): HTMLElement[] => {
    const modal = document.querySelector<HTMLElement>('.sheet-backdrop, [role="dialog"]')
    const root = modal ?? document.body
    return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(isVisible)
}

const focusFirst = (): void => {
    const items = focusables()
    const target = items.find(item => item.hasAttribute('data-focus-default')) ?? items[0]
    target?.focus()
}

export default defineNuxtPlugin(nuxtApp => {
    const router = useRouter()
    let isRemote = false

    const isKidArea = (): boolean => KID_AREAS.some(pattern => pattern.test(router.currentRoute.value.path))

    const goBack = (): void => {
        if (document.querySelector('.sheet-backdrop, [role="dialog"]')) {
            return
        }
        if (window.history.length > 1) {
            router.back()
            return
        }
        void navigateTo(isKidArea() ? '/kid' : '/home')
    }

    window.addEventListener('keydown', event => {
        if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
            return
        }
        const target = event.target instanceof HTMLElement ? event.target : null
        if (target && (TEXT_FIELDS.includes(target.tagName) || OWN_ARROW_ROLES.includes(target.getAttribute('role') ?? '') || target.isContentEditable)) {
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
        if (BACK_KEYS.includes(event.key) || event.keyCode === 4 || (event.key === 'Escape' && (isRemote || isKidArea()))) {
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
        if (isRemote) {
            requestAnimationFrame(focusFirst)
        }
    })
})
