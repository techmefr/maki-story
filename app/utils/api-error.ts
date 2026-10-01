export const apiErrorMessage = (error: unknown, fallback: string): string =>
    (error as { statusMessage?: string }).statusMessage === UNREACHABLE_MESSAGE ? UNREACHABLE_MESSAGE : fallback
