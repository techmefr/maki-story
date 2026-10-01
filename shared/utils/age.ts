export const AGE_TAGS: IAgeTag[] = [
    { id: '0-3', label: '0-3 ans', min: 0, max: 3 },
    { id: '4-6', label: '4-6 ans', min: 4, max: 6 },
    { id: '7-9', label: '7-9 ans', min: 7, max: 9 },
    { id: '10+', label: '10 ans et +', min: 10, max: 99 },
]

export const ageTagOf = (ageMin: number | null, ageMax: number | null): IAgeTag | null => {
    if (ageMin === null) {
        return null
    }
    const high = ageMax ?? ageMin
    return AGE_TAGS.find(tag => ageMin <= tag.max && high >= tag.min) ?? null
}

export const ageLabelOf = (ageMin: number | null, ageMax: number | null): string => {
    if (ageMin === null) {
        return ''
    }
    if (ageMax === null || ageMax === ageMin) {
        return `${ageMin} ans`
    }
    return `${ageMin}-${ageMax} ans`
}
