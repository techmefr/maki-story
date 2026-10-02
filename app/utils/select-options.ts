export const languageSelectOptions = (items: ILanguage[], emptyLabel?: string): { value: string; label: string }[] => [
    ...(emptyLabel === undefined ? [] : [{ value: '', label: emptyLabel }]),
    ...items.map(item => ({ value: item.code, label: item.flag + ' ' + item.label })),
]
