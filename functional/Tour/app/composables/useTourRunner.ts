import type { Driver, PopoverDOM } from 'driver.js'

const WAIT_MS = 4000
const POLL_MS = 100
const AUTO_START_ROUTE = '/home'

const findAnchor = (testid: string): HTMLElement | null =>
    Array.from(document.querySelectorAll<HTMLElement>(`[data-testid="${testid}"]`)).find(item => item.getClientRects().length > 0) ?? null

const waitForAnchor = async (testid: string, isAlive: () => boolean): Promise<HTMLElement | null> => {
    const deadline = Date.now() + WAIT_MS
    let found = findAnchor(testid)
    while (!found && isAlive() && Date.now() < deadline) {
        await new Promise<void>(resolve => setTimeout(resolve, POLL_MS))
        found = findAnchor(testid)
    }
    return found
}

const isReducedMotion = (): boolean => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const useTourRunner = () => {
    const { t } = useI18n()
    const route = useRoute()
    const { current } = useCurrentMember()
    const tour = useTour()
    const isSettingsOpen = useState<boolean>('profile-menu-open', () => false)

    let active: Driver | null = null
    let steps: ITourStep[] = []
    let audience: TourAudience = 'parent'
    let index = 0

    const end = (): void => {
        active = null
        tour.isRunning.value = false
        void tour.finish().catch(() => undefined)
    }

    const addSkip = (popover: PopoverDOM): void => {
        popover.wrapper.querySelector('.tour-skip')?.remove()
        const skip = document.createElement('button')
        skip.type = 'button'
        skip.className = 'tour-skip'
        skip.dataset.testid = 'tour-skip'
        skip.textContent = t('tour.skip')
        skip.addEventListener('click', () => active?.destroy())
        popover.wrapper.append(skip)
    }

    const show = async (start: number, direction: 1 | -1): Promise<void> => {
        let position = start
        while (active && position >= 0 && position < steps.length) {
            const step = steps[position]!
            if (route.path !== step.route) {
                await navigateTo(step.route)
            }
            const anchor = await waitForAnchor(step.anchor, () => active !== null)
            if (!active) {
                return
            }
            if (anchor) {
                index = position
                const isLast = position === steps.length - 1
                active.highlight({
                    element: anchor,
                    popover: {
                        title: t(`tour.${audience}.${step.id}.title`),
                        description: t(`tour.${audience}.${step.id}.body`),
                        side: 'bottom',
                        align: 'center',
                        showButtons: ['previous', 'next', 'close'],
                        disableButtons: position === 0 ? ['previous'] : [],
                        showProgress: true,
                        progressText: t('tour.progress', { current: position + 1, total: steps.length }),
                        prevBtnText: t('tour.previous'),
                        nextBtnText: isLast ? t('tour.done') : t('tour.next'),
                        closeBtnLabel: t('tour.close'),
                        onPopoverRender: addSkip,
                        onNextClick: () => (isLast ? active?.destroy() : void show(index + 1, 1)),
                        onPrevClick: () => void show(index - 1, -1),
                        onCloseClick: () => active?.destroy(),
                    },
                })
                return
            }
            position += direction
        }
        if (direction === 1) {
            active?.destroy()
        }
    }

    const run = async (): Promise<void> => {
        const member = current.value
        if (!member || member.role === 'child' || tour.isRunning.value) {
            return
        }
        tour.isRunning.value = true
        audience = member.role === 'parent' ? 'parent' : 'relative'
        steps = tourStepsFor(audience)
        const [{ driver }] = await Promise.all([import('driver.js'), import('driver.js/dist/driver.css'), import('../assets/css/tour.css')])
        const isReduced = isReducedMotion()
        active = driver({
            animate: !isReduced,
            smoothScroll: !isReduced,
            allowClose: true,
            overlayClickBehavior: 'none',
            disableActiveInteraction: true,
            overlayOpacity: 0.6,
            stagePadding: 6,
            stageRadius: 16,
            popoverClass: 'tour-popover',
            onDestroyed: end,
        })
        await show(0, 1)
    }

    const startIfPending = async (): Promise<void> => {
        const member = current.value
        if (!member || member.role === 'child' || tour.isRunning.value || route.path !== AUTO_START_ROUTE || isSettingsOpen.value) {
            return
        }
        try {
            const state = await tour.load()
            if (state.status === 'pending') {
                await run()
            }
        } catch (_error) {
            return
        }
    }

    onMounted(startIfPending)
    watch(() => current.value?.id, startIfPending)
    watch(tour.isRequested, requested => {
        if (requested) {
            tour.isRequested.value = false
            void run()
        }
    })
}
