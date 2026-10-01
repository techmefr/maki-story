const modules = import.meta.glob<{ default: Record<string, unknown> }>('../i18n/locales/*/*.json')

export const loadLocaleMessages = async (locale: string): Promise<TMessages> => {
    const prefix = `../i18n/locales/${locale}/`
    const merged: TMessages = {}
    const loaded = await Promise.all(
        Object.entries(modules)
            .filter(([path]) => path.startsWith(prefix))
            .map(async ([path, load]) => {
                const namespace = path.slice(prefix.length).replace(/\.json$/, '')
                return flattenMessages((await load()).default, namespace)
            }),
    )
    for (const part of loaded) {
        Object.assign(merged, part)
    }
    return merged
}
