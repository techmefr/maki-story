export const useMemberPhotos = () => {
    const { fetchUrl } = useFiles()
    const urls = useState<Record<string, string>>('member-photo-urls', () => ({}))

    const preload = async (members: IMember[]): Promise<void> => {
        const missing = members.filter(member => member.photoFileId && !urls.value[member.photoFileId])
        await Promise.all(
            missing.map(async member => {
                try {
                    const url = await fetchUrl(member.photoFileId as string)
                    urls.value = { ...urls.value, [member.photoFileId as string]: url }
                } catch (_error) {
                    console.warn(`La photo de ${member.name} n a pas pu etre chargee`)
                }
            }),
        )
    }

    const urlFor = (member: IMember | null): string | null => {
        if (!member || !member.photoFileId) {
            return null
        }
        return urls.value[member.photoFileId] ?? null
    }

    const register = (fileId: string, url: string): void => {
        urls.value = { ...urls.value, [fileId]: url }
    }

    return { preload, urlFor, register }
}
