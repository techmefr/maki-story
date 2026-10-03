export const TAG_ICON_PATHS: Record<TagIconId, string> = {
    hat: 'M2 17c3 1.5 6 1.5 10 1.5s7 0 10-1.5M6.5 15c0-5 1-9 3-9 1 0 1.5 1 2.5 1s1.5-1 2.5-1c2 0 3 4 3 9M7 12.5c3 1 7 1 10 0',
    waves: 'M2 9c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 14c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 19c2-2 4-2 6 0s4 2 6 0 4-2 6 0',
    tree: 'M12 3l6 8h-3l4 6H5l4-6H6zM12 17v4',
    star: 'M12 2.5l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.7 5.9 21.1l1.4-6.8L2.2 9.6l6.9-.8z',
    crown: 'M3 19L2 8l5 4 5-7 5 7 5-4-1 11zM4 22h16',
    paw: 'M12 20c-3 0-6-2-6-4.5S9 12 12 12s6 1 6 3.5S15 20 12 20zM5.5 10.5a1.5 1.5 0 1 0 .01 0M9.5 6.5a1.5 1.5 0 1 0 .01 0M14.5 6.5a1.5 1.5 0 1 0 .01 0M18.5 10.5a1.5 1.5 0 1 0 .01 0',
    moon: 'M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z',
    heart: 'M12 21C5 15.5 3 12 3 8.8A4.8 4.8 0 0 1 12 6.5 4.8 4.8 0 0 1 21 8.8C21 12 19 15.5 12 21z',
    smile: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18zM8.5 14a4.5 4.5 0 0 0 7 0M9 9.5v.5M15 9.5v.5',
    compass: 'M12 3a9 9 0 1 0 0 18a9 9 0 0 0 0-18zM15.5 8.5l-2 5-5 2 2-5z',
    question: 'M9 9a3 3 0 1 1 4 2.8c-1 .5-1 1.2-1 2.2M12 18v.5',
    book: 'M4 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-7',
    sun: 'M12 8a4 4 0 1 0 0 8a4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
    flag: 'M5 21V4M5 4h12l-2 4 2 4H5',
}

export const TAG_ICON_IDS = Object.keys(TAG_ICON_PATHS) as TagIconId[]
export const TAG_COLOR_IDS: VoiceColorId[] = ['sun', 'sky', 'mint', 'grape', 'pink', 'coral']
export const TAG_FALLBACK_LANGUAGE = 'en'
export const MAX_TAG_NAME_LENGTH = 40
export const MAX_BOOK_TAGS = 12
export const MAX_TAGS_PER_FAMILY = 60

const LANGUAGE_CODE = /^[a-z]{2,3}$/
const DIACRITICS = /[̀-ͯ]/g
const NON_SLUG = /[^a-z0-9]+/g
const EDGE_DASH = /^-+|-+$/g

export const slugifyTag = (name: string): string => name.toLowerCase().normalize('NFD').replace(DIACRITICS, '').replace(NON_SLUG, '-').replace(EDGE_DASH, '')

export const cleanTagNames = (names: Record<string, string>): Record<string, string> => {
    const cleaned: Record<string, string> = {}
    for (const [language, name] of Object.entries(names)) {
        const trimmed = typeof name === 'string' ? name.trim() : ''
        if (trimmed !== '') {
            cleaned[language] = trimmed
        }
    }
    return cleaned
}

export const slugSourceOf = (names: Record<string, string>): string => {
    const cleaned = cleanTagNames(names)
    return cleaned.en ?? cleaned.fr ?? Object.values(cleaned)[0] ?? ''
}

export const slugForNames = (names: Record<string, string>): string => slugifyTag(slugSourceOf(names))

export const tagLabel = (tag: { slug: string; names: Record<string, string> }, language: string): string => {
    const chosen = tag.names[language]?.trim()
    if (chosen) {
        return chosen
    }
    const english = tag.names[TAG_FALLBACK_LANGUAGE]?.trim()
    return english || tag.slug
}

export const missingTagLanguages = (tag: { names: Record<string, string> }, languages: readonly string[]): string[] =>
    languages.filter(language => !tag.names[language]?.trim())

export const suggestTagSlugs = (tags: readonly { slug: string; keywords: string[] }[], subjects: readonly string[]): string[] => {
    const text = subjects.join(' ').toLowerCase()
    return tags.filter(tag => tag.keywords.some(keyword => keyword !== '' && text.includes(keyword.toLowerCase()))).map(tag => tag.slug)
}

export const checkTagInput = (input: ITagInput, takenSlugs: readonly string[], currentSlug: string | null = null): TagProblem | null => {
    const names = cleanTagNames(input.names)
    if (Object.keys(names).length === 0) {
        return 'name-required'
    }
    if (Object.keys(names).some(language => !LANGUAGE_CODE.test(language))) {
        return 'language-invalid'
    }
    if (Object.values(names).some(name => name.length > MAX_TAG_NAME_LENGTH)) {
        return 'name-too-long'
    }
    if (!TAG_COLOR_IDS.includes(input.color)) {
        return 'color-invalid'
    }
    if (!TAG_ICON_IDS.includes(input.icon)) {
        return 'icon-invalid'
    }
    if (currentSlug === null) {
        const slug = slugForNames(names)
        if (slug === '') {
            return 'slug-empty'
        }
        if (takenSlugs.includes(slug)) {
            return 'slug-taken'
        }
    }
    return null
}

const entry = (slug: string, color: VoiceColorId, icon: TagIconId, names: Record<string, string>, keywords: string[]): IDefaultTag => ({
    slug,
    color,
    icon,
    names,
    keywords,
})

export const DEFAULT_TAGS: IDefaultTag[] = [
    entry('western', 'sun', 'hat', { fr: 'Western', mg: 'Western', en: 'Western', es: 'Oeste' }, ['western', 'cowboy']),
    entry('ocean', 'sky', 'waves', { fr: 'Océan', mg: 'Ranomasina', en: 'Ocean', es: 'Océano' }, ['ocean', 'sea', 'ship']),
    entry('forest', 'mint', 'tree', { fr: 'Forêt', mg: 'Ala', en: 'Forest', es: 'Bosque' }, ['forest', 'woods']),
    entry('space', 'grape', 'star', { fr: 'Espace', en: 'Space', es: 'Espacio' }, ['space', 'moon', 'star']),
    entry('castle', 'pink', 'crown', { fr: 'Château', en: 'Castle', es: 'Castillo' }, ['castle', 'princess', 'knight']),
    entry('animals', 'coral', 'paw', { fr: 'Animaux', mg: 'Biby', en: 'Animals', es: 'Animales' }, ['animal', 'lemur', 'fox']),
    entry('calm', 'sky', 'moon', { fr: 'Calme', mg: 'Milamina', en: 'Calm', es: 'Calma' }, ['bedtime', 'sleep', 'lullab']),
    entry('funny', 'sun', 'smile', { fr: 'Drôle', mg: 'Mahatsikaiky', en: 'Funny', es: 'Divertido' }, ['humor', 'funny']),
    entry('adventure', 'coral', 'compass', { fr: 'Aventure', en: 'Adventure', es: 'Aventura' }, ['adventure', 'journey']),
    entry('cuddle', 'pink', 'heart', { fr: 'Câlin', en: 'Cuddle', es: 'Cariño' }, ['love', 'family', 'friendship']),
    entry('mystery', 'grape', 'question', { fr: 'Mystère', en: 'Mystery', es: 'Misterio' }, ['mystery', 'detective']),
]
