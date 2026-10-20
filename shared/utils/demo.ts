export const DEMO_FAMILY = 'maki-demo-family'
export const DEMO_PROFILES = [
    { id: 'maki-demo-maman', accountId: 'maki-demo-parent', email: 'parent@maki.demo', name: 'Maman', role: 'parent', path: '/home' },
    { id: 'maki-demo-papa', accountId: 'maki-demo-parent', email: 'parent@maki.demo', name: 'Papa', role: 'parent', path: '/home' },
    { id: 'maki-demo-matteo', accountId: 'maki-demo-parent', email: 'parent@maki.demo', name: 'Mattéo', role: 'child', path: '/kid' },
    { id: 'maki-demo-lina', accountId: 'maki-demo-parent', email: 'parent@maki.demo', name: 'Lina', role: 'child', path: '/kid' },
    { id: 'maki-demo-mamie', accountId: 'maki-demo-relative', email: 'mamie@maki.demo', name: 'Mamie Yolande avec un nom très long', role: 'relative', path: '/relative' },
] as const

export const isLocalDemo = (isDev: boolean, enabled: string | undefined, database: string | undefined, host: string): boolean => {
    if (!isDev || enabled !== 'true' || !database) return false
    try {
        const db = new URL(database)
        return ['localhost', '127.0.0.1', '[::1]'].includes(host)
            && ['localhost', '127.0.0.1', '[::1]'].includes(db.hostname)
            && db.pathname === '/maki_demo'
    } catch {
        return false
    }
}

export const demoProfile = (id: unknown) => DEMO_PROFILES.find(profile => profile.id === id)
