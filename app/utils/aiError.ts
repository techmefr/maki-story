export const AI_UNAVAILABLE_MESSAGE = 'L’IA n’est pas configurée sur ce serveur. Cette fonction est indisponible pour l’instant.'
export const AI_QUOTA_MESSAGE = 'Le budget IA de ce mois est épuisé. Il sera remis à zéro au début du mois prochain.'

export const aiErrorMessage = (error: unknown): string => {
    const status = (error as { statusCode?: number }).statusCode
    if (status === 429) {
        return AI_QUOTA_MESSAGE
    }
    if (status === 503) {
        return AI_UNAVAILABLE_MESSAGE
    }
    if (status === 403) {
        return 'Seuls les parents peuvent utiliser l’IA.'
    }
    if (status === 502) {
        return 'L’IA a donné une réponse inutilisable. Réessaie dans un instant.'
    }
    return 'L’IA n’a pas pu répondre pour le moment. Réessaie plus tard.'
}

export const formatUsd = (amount: number): string => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
}
