export interface ITourStep {
    id: string
    route: string
    anchor: string
}

export const PARENT_TOUR_STEPS: ITourStep[] = [
    { id: 'profile', route: '/home', anchor: 'profile-open' },
    { id: 'library', route: '/home', anchor: 'home-card-library' },
    { id: 'newBook', route: '/home', anchor: 'home-card-new-book' },
    { id: 'studio', route: '/home', anchor: 'home-card-to-record' },
    { id: 'review', route: '/home', anchor: 'home-card-review' },
    { id: 'trash', route: '/home', anchor: 'home-card-trash' },
    { id: 'family', route: '/home', anchor: 'nav-tab-family' },
    { id: 'members', route: '/family', anchor: 'family-invite' },
    { id: 'schedule', route: '/family', anchor: 'family-parental' },
    { id: 'sharing', route: '/sharing', anchor: 'sharing-title' },
    { id: 'treasure', route: '/vault', anchor: 'vault-counter' },
    { id: 'activity', route: '/family/activity', anchor: 'activity-all' },
    { id: 'replay', route: '/family/activity', anchor: 'settings-open' },
]

export const RELATIVE_TOUR_STEPS: ITourStep[] = [
    { id: 'children', route: '/home', anchor: 'home-kid-cards' },
    { id: 'message', route: '/home', anchor: 'home-kid-cards' },
    { id: 'record', route: '/home', anchor: 'home-card-requests' },
    { id: 'notifications', route: '/home', anchor: 'bell' },
    { id: 'replay', route: '/home', anchor: 'settings-open' },
]

export const tourStepsFor = (audience: TourAudience): ITourStep[] => (audience === 'parent' ? PARENT_TOUR_STEPS : RELATIVE_TOUR_STEPS)
