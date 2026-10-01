export const AGE_TAGS: IAgeTag[] = [
    { id: '0-3', min: 0, max: 3 },
    { id: '4-6', min: 4, max: 6 },
    { id: '7-9', min: 7, max: 9 },
    { id: '10+', min: 10, max: 99 },
]

export const ageTagOf = (ageMin: number | null, ageMax: number | null): IAgeTag | null => {
    if (ageMin === null) {
        return null
    }
    const high = ageMax ?? ageMin
    return AGE_TAGS.find(tag => ageMin <= tag.max && high >= tag.min) ?? null
}
