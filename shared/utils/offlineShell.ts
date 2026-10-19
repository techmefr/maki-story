export const offlineShellAssets = (html: string): string[] => [...new Set(
    [...html.matchAll(/(?:src|href)=["']([^"']+)["']/g)]
        .map(match => match[1]!)
        .filter(path => path.startsWith('/_nuxt/') || path.startsWith('/fonts/')),
)]

interface IClientAsset {
    file: string
    isEntry?: boolean
    imports?: string[]
    css?: string[]
}

export const offlineManifestAssets = (manifest: Record<string, IClientAsset>): string[] => {
    const wanted = ['layouts/blank.vue', 'layouts/default.vue', 'layouts/kid.vue', 'pages/kid/index.vue', 'pages/kid/library.vue', 'pages/kid/treasure.vue', 'pages/kid/listen/[id].vue', 'pages/books/[id]/play.vue', 'pages/login.vue']
    const seen = new Set<string>()
    const files = new Set<string>()
    const visit = (key: string): void => {
        if (seen.has(key) || !manifest[key]) {
            return
        }
        seen.add(key)
        const asset = manifest[key]!
        files.add(`/_nuxt/${asset.file}`)
        asset.css?.forEach(file => files.add(`/_nuxt/${file}`))
        asset.imports?.forEach(visit)
    }
    Object.entries(manifest).filter(([key, asset]) => asset.isEntry || wanted.includes(key)).forEach(([key]) => visit(key))
    return [...files].sort()
}
